import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { SensorReading, SensorReadingInsert, AlertInsert } from '@/lib/database.types'
import { sendDangerAlert } from '@/lib/email'
// SMS notifications removed - keeping only alert creation

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const deviceUuid = url.searchParams.get('device_uuid')
    const deviceIdString = url.searchParams.get('device_id')
    const limitParam = url.searchParams.get('limit')
    const limit = Math.min(Math.max(parseInt(limitParam || '5', 10) || 5, 1), 50)

    // Si se solicita por dispositivo, devolver últimas N lecturas de ese dispositivo
    if (deviceUuid || deviceIdString) {
      let targetDeviceUuid: string

      if (deviceUuid) {
        targetDeviceUuid = deviceUuid
      } else if (deviceIdString) {
        // Si vino el device_id string (del ESP32), convertirlo a UUID buscando en devices
        const { data: foundDevice } = await supabase
          .from('devices')
          .select('id')
          .eq('device_id', deviceIdString)
          .single()

        if (!foundDevice) {
          return NextResponse.json(
            { error: 'Dispositivo no encontrado' },
            { status: 404 }
          )
        }
        targetDeviceUuid = foundDevice.id
      } else {
        return NextResponse.json(
          { error: 'Parámetros inválidos' },
          { status: 400 }
        )
      }

      const { data: readings, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('device_id', targetDeviceUuid)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        return NextResponse.json(
          { error: 'Error al obtener lecturas del dispositivo' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        readings: readings || [],
        count: readings?.length || 0,
        timestamp: new Date().toISOString(),
      })
    }

    // Por defecto: devolver el último registro global
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Error al obtener datos del sensor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data as SensorReading,
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { device_id, sensor_value, gas_level, buzzer_activated, user_id } = await request.json()
    

    // Validar datos requeridos
    if (!device_id || sensor_value === undefined || !gas_level) {
      return NextResponse.json(
        { error: 'device_id, sensor_value y gas_level son requeridos' },
        { status: 400 }
      )
    }

    // Buscar el dispositivo por device_id (string que viene del ESP32)
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, device_name')
      .eq('device_id', device_id)
      .single()

    if (deviceError || !device) {
      return NextResponse.json(
        { error: 'Dispositivo no encontrado' },
        { status: 404 }
      )
    }

    // Buscar el user_id asociado al dispositivo en user_devices (usando el UUID)
    const { data: userDevice } = await supabase
      .from('user_devices')
      .select('user_id')
      .eq('device_id', device.id)
      .single()

    const userId = (userDevice ? userDevice.user_id : null) || user_id

    // Insertar el registro del sensor con device_id y user_id (si existe)
    const sensorData: SensorReadingInsert = {
      device_id: device.id, // Usar el UUID de la base de datos
      user_id: userId,
      sensor_value: parseInt(sensor_value),
      gas_level: gas_level,
      buzzer_activated: buzzer_activated || false,
      timestamp: new Date().toISOString()
    }

    const { data: insertedData, error: insertError } = await supabase
      .from('sensor_readings')
      .insert(sensorData)
      .select()
      .single()

    if (insertError) {
      return NextResponse.json(
        { error: 'Error guardando datos del sensor' },
        { status: 500 }
      )
    }

    // Actualizar last_seen del dispositivo
    await supabase
      .from('devices')
      .update({ 
        last_seen: new Date().toISOString(),
        is_active: true 
      })
      .eq('id', device.id)

    // Lógica de alertas automáticas
    if (gas_level === 'WARNING' || gas_level === 'DANGER') {
      // Solo crear alertas si hay un usuario asociado
      if (!userId) {
        return NextResponse.json({
          success: true,
          message: 'Datos del sensor guardados correctamente',
          data: insertedData,
          timestamp: new Date().toISOString()
        })
      }
      
      // Verificar si ya existe una alerta pendiente (no resuelta) para este dispositivo y nivel
      const { data: existingAlert } = await supabase
        .from('alerts')
        .select('id, warning_start_time, is_sent, notification_sent_at')
        .eq('device_id', device.id)
        .eq('is_resolved', false)
        .eq('gas_level', gas_level)
        .single()

      if (!existingAlert) {
        // Crear nueva alerta pendiente
        
        const alertData: AlertInsert = {
          user_id: userId,
          device_id: device.id,
          alert_type: gas_level === 'DANGER' ? 'critical' : 'warning',
          message: gas_level === 'DANGER' 
            ? 'Nivel de gas PELIGROSO detectado - Evacue inmediatamente'
            : 'Nivel de gas elevado detectado - Revise el área',
          sensor_value: parseInt(sensor_value),
          gas_level: gas_level,
          warning_start_time: new Date().toISOString(),
          is_sent: false,
          is_resolved: false,
          notification_type: 'email'
        }

        await supabase
          .from('alerts')
          .insert(alertData)
      } else {
        // Verificar si han pasado 30 segundos desde que comenzó la alerta
        const warningStartTime = new Date(existingAlert.warning_start_time!)
        const currentTime = new Date()
        const timeDifferenceMs = currentTime.getTime() - warningStartTime.getTime()
        const timeDifferenceSeconds = timeDifferenceMs / 1000

        // Marcar alerta como "notificada" después de 30 segundos Y ENVIAR EMAIL
        if (timeDifferenceSeconds >= 30 && !existingAlert.is_sent) {
          // Obtener información del usuario para el email
          const { data: userData } = await supabase
            .from('users')
            .select('email, full_name')
            .eq('id', userId)
            .single()

          if (userData && userData.email) {
            // Enviar email de alerta
            await sendDangerAlert({
              to: userData.email,
              deviceName: device.device_name,
              gasLevel: gas_level,
              sensorValue: parseInt(sensor_value),
              alertTime: new Date().toLocaleString('es-ES'),
              userFullName: userData.full_name
            })

          }

          // Actualizar la alerta como enviada
          await supabase
            .from('alerts')
            .update({
              is_sent: true,
              notification_sent_at: new Date().toISOString()
            })
            .eq('id', existingAlert.id)
        }
      }
    } else if (gas_level === 'NORMAL') {
      // Resolver alertas activas cuando el nivel vuelve a normal
      await supabase
        .from('alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('device_id', device.id)
        .eq('is_resolved', false)

    }

    return NextResponse.json({
      success: true,
      message: 'Datos del sensor guardados correctamente',
      data: insertedData,
      timestamp: new Date().toISOString()
    })

  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
