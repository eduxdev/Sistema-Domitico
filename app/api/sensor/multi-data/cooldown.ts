import { supabase } from "@/lib/supabase"
import { obtenerConfiguracionUsuario } from './user-config'

/**
 * Verifica cooldown para emails usando configuración del usuario
 */
export async function puedeEnviarEmail(deviceId: string, usuarioEmail: string): Promise<{ puede: boolean; razon?: string }> {
  try {
    const config = await obtenerConfiguracionUsuario(usuarioEmail)
    
    if (!config.email_enabled) {
      return { 
        puede: false, 
        razon: 'Notificaciones por email deshabilitadas por el usuario.'
      }
    }

    const ahora = new Date()
    const cooldownTime = new Date(ahora.getTime() - (config.email_cooldown_minutes * 60 * 1000))
    const hourAgo = new Date(ahora.getTime() - (60 * 60 * 1000))

    const { data: ultimasNotificaciones, error } = await supabase
      .from('notificaciones_enviadas')
      .select('*')
      .eq('destinatario', usuarioEmail)
      .like('mensaje', `%${deviceId}%`)
      .eq('tipo', 'email')
      .eq('estado', 'enviado')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error verificando cooldown:', error)
      return { puede: true }
    }

    if (!ultimasNotificaciones || ultimasNotificaciones.length === 0) {
      return { puede: true }
    }

    const ultimoEmail = new Date(ultimasNotificaciones[0].created_at || '')
    if (ultimoEmail > cooldownTime) {
      const minutosRestantes = Math.ceil((ultimoEmail.getTime() + (config.email_cooldown_minutes * 60 * 1000) - ahora.getTime()) / (60 * 1000))
      return { 
        puede: false, 
        razon: `Cooldown activo (${config.email_cooldown_minutes} min). Próximo email en ${minutosRestantes} minutos.`
      }
    }

    const emailsUltimaHora = ultimasNotificaciones.filter(notif => 
      new Date(notif.created_at || '') > hourAgo
    ).length

    if (emailsUltimaHora >= config.max_emails_per_hour) {
      return { 
        puede: false, 
        razon: `Límite de ${config.max_emails_per_hour} emails por hora alcanzado.`
      }
    }

    return { puede: true }
  } catch (error) {
    console.error('Error en verificación de cooldown:', error)
    return { puede: true }
  }
}
