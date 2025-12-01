import { supabase } from '@/lib/supabase'

export interface NotificacionData {
  tipo: 'email' | 'whatsapp'
  destinatario: string
  asunto?: string
  mensaje: string
  estado: 'enviado' | 'fallido' | 'pendiente'
  lectura_id?: number
  valor_ppm?: number
  nivel_alerta?: string
  respuesta_api?: string
  error_mensaje?: string
}

export async function registrarNotificacion(data: NotificacionData) {
  try {
    const { data: result, error } = await supabase
      .from('notificaciones_enviadas')
      .insert([data])
      .select()

    if (error) {
      console.error('Error registrando notificación:', error)
      return { success: false, error }
    }

    return { success: true, data: result[0] }
  } catch (error) {
    console.error('Error en registrarNotificacion:', error)
    return { success: false, error }
  }
}
