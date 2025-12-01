import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAuth } from "@/lib/auth"

/**
 * API Endpoint: Reclamar un dispositivo
 * POST /api/devices/claim
 */
export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { device_id, nombre_personalizado, ubicacion } = body

    // Validar que venga el device_id
    if (!device_id) {
      return NextResponse.json(
        { error: "El campo device_id es requerido" },
        { status: 400 }
      )
    }

    // Verificar que el dispositivo existe y no está reclamado
    const { data: dispositivo, error: fetchError } = await supabase
      .from('dispositivos')
      .select('*')
      .eq('device_id', device_id)
      .single()

    if (fetchError || !dispositivo) {
      return NextResponse.json(
        { error: "Dispositivo no encontrado" },
        { status: 404 }
      )
    }

    if (dispositivo.is_claimed) {
      return NextResponse.json(
        { error: "Este dispositivo ya ha sido reclamado por otro usuario" },
        { status: 409 }
      )
    }

    // Reclamar el dispositivo
    const { data: updatedDevice, error: updateError } = await supabase
      .from('dispositivos')
      .update({
        is_claimed: true,
        claimed_by: user.userId,
        claimed_at: new Date().toISOString(),
        nombre: nombre_personalizado || dispositivo.nombre,
        ubicacion: ubicacion || dispositivo.ubicacion
      })
      .eq('device_id', device_id)
      .select('*, usuarios:claimed_by(nombre, apellidos, email)')
      .single()

    if (updateError) {
      console.error('Error reclamando dispositivo:', updateError)
      return NextResponse.json(
        { error: "Error al reclamar dispositivo" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Dispositivo reclamado exitosamente",
      device: updatedDevice
    })

  } catch (error) {
    console.error('Error en API:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
