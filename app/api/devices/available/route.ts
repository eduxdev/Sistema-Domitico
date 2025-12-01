import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAuth } from "@/lib/auth"

/**
 * API Endpoint: Obtener dispositivos disponibles para reclamar
 * GET /api/devices/available
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

    // Obtener dispositivos no reclamados
    const { data: dispositivos, error } = await supabase
      .from('dispositivos')
      .select('*')
      .eq('is_claimed', false)
      .eq('estado', 'activo')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error obteniendo dispositivos:', error)
      return NextResponse.json(
        { error: "Error al obtener dispositivos" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      devices: dispositivos || []
    })

  } catch (error) {
    console.error('Error en API:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
