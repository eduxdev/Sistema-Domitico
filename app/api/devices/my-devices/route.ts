import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener dispositivos reclamados por el usuario con información detallada
    const { data: userDevices, error } = await supabase
      .from('user_devices')
      .select(`
        id,
        nickname,
        location,
        added_at,
        device:devices (
          id,
          device_id,
          device_name,
          device_type,
          mac_address,
          ip_address,
          is_active,
          last_seen,
          created_at
        )
      `)
      .eq('user_id', user.userId)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('Error obteniendo dispositivos del usuario:', error)
      throw error
    }

    // Para cada dispositivo, obtener la última lectura del sensor
    const devicesWithSensorData = await Promise.all(
      (userDevices || []).map(async (item) => {
        const deviceId = item.device?.id
        
        if (!deviceId) {
          return {
            ...item,
            latestReading: null
          }
        }

        // Obtener la última lectura del sensor para este dispositivo
        const { data: latestReadingData } = await supabase
          .from('sensor_readings')
          .select('*')
          .eq('device_id', deviceId)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle()

        return {
          ...item,
          latestReading: latestReadingData || null
        }
      })
    )

    return NextResponse.json({
      success: true,
      devices: devicesWithSensorData
    })

  } catch (error) {
    console.error('Error en my-devices:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
