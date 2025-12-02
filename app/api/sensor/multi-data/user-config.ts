import { supabase } from "@/lib/supabase"
import { DEFAULT_EMAIL_COOLDOWN_MINUTES, DEFAULT_MAX_EMAILS_PER_HOUR } from './config'

/**
 * Obtener configuración de notificaciones del usuario
 */
export async function obtenerConfiguracionUsuario(usuarioEmail: string) {
  try {
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', usuarioEmail)
      .single()

    if (userError || !usuario) {
      return {
        email_cooldown_minutes: DEFAULT_EMAIL_COOLDOWN_MINUTES,
        max_emails_per_hour: DEFAULT_MAX_EMAILS_PER_HOUR,
        email_enabled: true,
        critical_only: false
      }
    }

    const { data: settings, error: settingsError } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', usuario.id)
      .single()

    if (settingsError || !settings) {
      return {
        email_cooldown_minutes: DEFAULT_EMAIL_COOLDOWN_MINUTES,
        max_emails_per_hour: DEFAULT_MAX_EMAILS_PER_HOUR,
        email_enabled: true,
        critical_only: false
      }
    }
    
    return {
      email_cooldown_minutes: settings.email_cooldown_minutes ?? DEFAULT_EMAIL_COOLDOWN_MINUTES,
      max_emails_per_hour: settings.max_emails_per_hour ?? DEFAULT_MAX_EMAILS_PER_HOUR,
      email_enabled: settings.email_enabled ?? true,
      critical_only: settings.critical_only ?? false
    }
  } catch (error) {
    console.error('Error obteniendo configuración:', error)
    return {
      email_cooldown_minutes: DEFAULT_EMAIL_COOLDOWN_MINUTES,
      max_emails_per_hour: DEFAULT_MAX_EMAILS_PER_HOUR,
      email_enabled: true,
      critical_only: false
    }
  }
}
