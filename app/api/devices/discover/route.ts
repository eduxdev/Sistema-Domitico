import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { networkDiscovery } from '@/lib/networkDiscovery'
import { verifyAuth } from '@/lib/auth'

// Inicializar el descubrimiento al cargar el módulo
let discoveryStarted = false

export async function GET(request: Request) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Iniciar descubrimiento si no está activo
    if (!discoveryStarted) {
      await networkDiscovery.startDiscovery()
      discoveryStarted = true
    }

    // Obtener dispositivos descubiertos en la red local (desde la base de datos)
    const localDevices = await networkDiscovery.getDiscoveredDevices()

    // Filtrar solo dispositivos que no están reclamados por otros usuarios
    const availableDevices = []
    
    for (const device of localDevices) {
      // Verificar en la base de datos si el dispositivo ya está reclamado
      const { data: existingClaim } = await supabase
        .from('user_devices')
        .select('user_id')
        .eq('device_id', device.deviceId)
        .single()

      if (!existingClaim) {
        availableDevices.push({
          ...device,
          canClaim: true
        })
      } else if (existingClaim.user_id === user.userId) {
        availableDevices.push({
          ...device,
          canClaim: false,
          ownedByUser: true
        })
      }
    }

    return NextResponse.json({
      success: true,
      devices: availableDevices,
      totalFound: localDevices.length
    })

  } catch (error) {
    console.error('Error en descubrimiento:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}