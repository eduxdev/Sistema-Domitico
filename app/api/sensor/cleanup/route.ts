import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * API Endpoint: Limpieza manual de lecturas antiguas
 * GET /apis/sensor/cleanup?mantener=50
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mantener = parseInt(searchParams.get('mantener') || '100')

    // Contar lecturas actuales
    const { count, error: countError } = await supabase
      .from('lecturas_gas')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      return NextResponse.json(
        { error: "Error al contar lecturas" },
        { status: 500 }
      )
    }

    if (!count || count <= mantener) {
      return NextResponse.json({
        success: true,
        message: `No hay necesidad de limpiar. Lecturas actuales: ${count}, Límite: ${mantener}`,
        lecturasEliminadas: 0,
        lecturasRestantes: count
      })
    }

    const lecturasAEliminar = count - mantener

    // Obtener IDs de las lecturas más antiguas
    const { data: lecturasViejas, error: fetchError } = await supabase
      .from('lecturas_gas')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(lecturasAEliminar)

    if (fetchError || !lecturasViejas) {
      return NextResponse.json(
        { error: "Error al obtener lecturas antiguas" },
        { status: 500 }
      )
    }

    const idsAEliminar = lecturasViejas.map(l => l.id)

    // Eliminar lecturas antiguas
    const { error: deleteError } = await supabase
      .from('lecturas_gas')
      .delete()
      .in('id', idsAEliminar)

    if (deleteError) {
      return NextResponse.json(
        { error: "Error al eliminar lecturas" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Limpieza completada exitosamente",
      lecturasEliminadas: lecturasAEliminar,
      lecturasRestantes: mantener,
      lecturasAnteriores: count
    })

  } catch (error) {
    console.error('Error en limpieza manual:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

/**
 * Eliminar TODAS las lecturas (usar con precaución)
 * DELETE /apis/sensor/cleanup
 */
export async function DELETE(request: Request) {
  try {
    const { error } = await supabase
      .from('lecturas_gas')
      .delete()
      .neq('id', 0) // Eliminar todas las filas

    if (error) {
      return NextResponse.json(
        { error: "Error al eliminar todas las lecturas" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Todas las lecturas han sido eliminadas"
    })

  } catch (error) {
    console.error('Error eliminando todas las lecturas:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}




