import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { networkDiscovery } from '@/lib/networkDiscovery'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { deviceId, nickname, location } = await request.json()

    // Verificar que el dispositivo está en la red local
    const localDevices = await networkDiscovery.getDiscoveredDevices()
    const targetDevice = localDevices.find(d => d.deviceId === deviceId)

    if (!targetDevice) {
      return NextResponse.json(
        { error: 'Dispositivo no encontrado en la red local' },
        { status: 404 }
      )
    }

    // Buscar el dispositivo en la base de datos primero
    const { data: existingDevice, error: findError } = await supabase
      .from('devices')
      .select('*')
      .eq('device_id', deviceId)
      .single()

    let device
    if (findError || !existingDevice) {
      // Si no existe, crearlo
      const { data: newDevice, error: createError } = await supabase
        .from('devices')
        .insert({
          device_id: deviceId,
          device_name: targetDevice.deviceName,
          device_type: targetDevice.deviceType,
          mac_address: targetDevice.macAddress,
          ip_address: targetDevice.ipAddress,
          is_active: true
        })
        .select()
        .single()

      if (createError) throw createError
      device = newDevice
    } else {
      // Si existe, actualizarlo
      const { data: updatedDevice, error: updateError } = await supabase
        .from('devices')
        .update({
          device_name: targetDevice.deviceName,
          ip_address: targetDevice.ipAddress,
          is_active: true,
          last_seen: new Date().toISOString()
        })
        .eq('id', existingDevice.id)
        .select()
        .single()

      if (updateError) throw updateError
      device = updatedDevice
    }

    // Verificar si el dispositivo ya está reclamado por este usuario
    const { data: existingClaim } = await supabase
      .from('user_devices')
      .select('id, user_id, nickname, location')
      .eq('device_id', device.id)
      .eq('user_id', user.userId)
      .single()

    // Si ya está reclamado por el mismo usuario, solo actualizar
    if (existingClaim && existingClaim.user_id === user.userId) {
      // Actualizar nickname y location si se proporcionaron
      const { data: updatedAssignment, error: updateError } = await supabase
        .from('user_devices')
        .update({
          nickname: nickname || existingClaim.nickname || targetDevice.deviceName,
          location: location || existingClaim.location || 'Sin ubicación'
        })
        .eq('id', existingClaim.id)
        .select()
        .single()

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: 'Dispositivo ya estaba reclamado por ti, se actualizó la información',
        device: {
          ...device,
          assignment: updatedAssignment,
          networkInfo: targetDevice
        }
      })
    }

    // Verificar si está reclamado por otro usuario
    const { data: otherUserClaim } = await supabase
      .from('user_devices')
      .select('user_id')
      .eq('device_id', device.id)
      .not('user_id', 'eq', user.userId)
      .single()

    if (otherUserClaim) {
      return NextResponse.json(
        { error: 'Dispositivo ya está reclamado por otro usuario' },
        { status: 409 }
      )
    }

    // Asignar dispositivo al usuario
    const { data: assignment, error: assignError } = await supabase
      .from('user_devices')
      .insert({
        user_id: user.userId,
        device_id: device.id,
        nickname: nickname || targetDevice.deviceName,
        location: location || 'Sin ubicación'
      })
      .select()
      .single()

    if (assignError) throw assignError

    // Enviar comando al dispositivo para notificar que ha sido reclamado
    try {
      await networkDiscovery.sendCommandToDevice(targetDevice.ipAddress, {
        command: 'claim',
        userId: user.userId,
        userEmail: user.email
      })
    } catch (cmdError) {
      console.warn('No se pudo notificar al dispositivo:', cmdError)
      // No fallar la operación si no se puede notificar al dispositivo
    }

    return NextResponse.json({
      success: true,
      device: {
        ...device,
        assignment,
        networkInfo: targetDevice
      }
    })

  } catch (error) {
    console.error('Error reclamando dispositivo:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}