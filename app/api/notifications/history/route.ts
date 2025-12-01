import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAuth } from "@/lib/auth"

/**
 * GET - Obtener historial de notificaciones del usuario
 */
export async function GET(request: Request) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const estado = searchParams.get('estado') // enviado, fallido
    const dias = parseInt(searchParams.get('dias') || '7')

    // Calcular fecha límite
    const fechaLimite = new Date()
    fechaLimite.setDate(fechaLimite.getDate() - dias)

    // Construir query
    let query = supabase
      .from('notificaciones_enviadas')
      .select('*')
      .eq('destinatario', authResult.email)
      .gte('created_at', fechaLimite.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit)

    if (estado) {
      query = query.eq('estado', estado)
    }

    const { data: notificaciones, error } = await query

    if (error) {
      console.error('Error obteniendo historial:', error)
      return NextResponse.json(
        { error: "Error al obtener historial" },
        { status: 500 }
      )
    }

    // Calcular estadísticas
    const stats = {
      total: notificaciones?.length || 0,
      enviados: notificaciones?.filter(n => n.estado === 'enviado').length || 0,
      fallidos: notificaciones?.filter(n => n.estado === 'fallido').length || 0,
      hoy: notificaciones?.filter(n => {
        const hoy = new Date()
        const fechaNotif = new Date(n.created_at || '')
        return fechaNotif.toDateString() === hoy.toDateString()
      }).length || 0
    }

    return NextResponse.json({
      success: true,
      data: notificaciones || [],
      stats,
      periodo: `Últimos ${dias} días`
    })

  } catch (error) {
    console.error('Error en historial de notificaciones:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
