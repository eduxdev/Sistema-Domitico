import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * API Endpoint: Registrar dispositivo ESP32
 * POST /api/devices/register
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { device_id, nombre, tipo, mac_address, ip_address } = body

    // Validar que venga el device_id
    if (!device_id) {
      return NextResponse.json(
        { error: "El campo device_id es requerido" },
        { status: 400 }
      )
    }

    // Verificar si el dispositivo ya existe
    const { data: existingDevice } = await supabase
      .from('dispositivos')
      .select('*')
      .eq('device_id', device_id)
      .single()

    if (existingDevice) {
      // Actualizar IP y MAC si cambió
      const { error: updateError } = await supabase
        .from('dispositivos')
        .update({
          ip_address: ip_address,
          mac_address: mac_address,
          updated_at: new Date().toISOString()
        })
        .eq('device_id', device_id)

      if (updateError) {
        console.error('Error actualizando dispositivo:', updateError)
      }

      return NextResponse.json({
        success: true,
        message: "Dispositivo ya registrado, información actualizada",
        device: existingDevice,
        is_claimed: existingDevice.is_claimed
      })
    }

    // Crear nuevo dispositivo
    const { data: newDevice, error } = await supabase
      .from('dispositivos')
      .insert([
        {
          device_id,
          nombre: nombre || `Dispositivo ${device_id}`,
          tipo: tipo || 'sensor_gas',
          mac_address,
          ip_address,
          is_claimed: false
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creando dispositivo:', error)
      return NextResponse.json(
        { error: "Error al registrar dispositivo" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Dispositivo registrado exitosamente",
      device: newDevice,
      is_claimed: false
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (error) {
    console.error('Error en API:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

/**
 * Endpoint OPTIONS para CORS (ESP32)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  })
}
