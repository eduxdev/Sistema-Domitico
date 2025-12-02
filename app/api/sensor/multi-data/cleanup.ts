import { supabase } from "@/lib/supabase"

/**
 * Limpia lecturas antiguas automáticamente - Mantiene máximo 50 registros
 */
export async function limpiarLecturasAntiguas() {
  try {
    const MAX_LECTURAS_TOTALES = 50

    const { count: totalCount } = await supabase
      .from('lecturas_sensores')
      .select('*', { count: 'exact', head: true })

    if (totalCount && totalCount > MAX_LECTURAS_TOTALES) {
      const lecturasAEliminar = totalCount - MAX_LECTURAS_TOTALES
      
      const { data: lecturasViejas } = await supabase
        .from('lecturas_sensores')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(lecturasAEliminar)

      if (lecturasViejas && lecturasViejas.length > 0) {
        const idsAEliminar = lecturasViejas.map(l => l.id)
        await supabase
          .from('lecturas_sensores')
          .delete()
          .in('id', idsAEliminar)
      }
    }
  } catch (error) {
    console.error('Error en limpieza automática:', error)
  }
}
