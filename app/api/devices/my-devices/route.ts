import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAuth } from "@/lib/auth"

/**
 * API Endpoint: Obtener dispositivos del usuario autenticado
 * GET /api/devices/my-devices
 */
export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    // Obtener dispositivos del usuario
    const { data: dispositivos, error } = await supabase
      .from('dispositivos')
      .select('*')
      .eq('claimed_by', user.userId)
      .eq('is_claimed', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error obteniendo dispositivos del usuario:', error)
      return NextResponse.json(
        { error: "Error al obtener tus dispositivos" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: dispositivos || []
    })

  } catch (error) {
    console.error('Error en API:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
