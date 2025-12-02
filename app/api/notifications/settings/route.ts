import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAuth } from "@/lib/auth"

/**
 * GET - Obtener configuración de notificaciones del usuario
 */
export async function GET(request: Request) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Buscar configuración del usuario en la base de datos
    const { data: settings, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', authResult.userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error obteniendo configuración:', error)
      return NextResponse.json(
        { error: "Error al obtener configuración" },
        { status: 500 }
      )
    }

    // Si no existe configuración, devolver valores por defecto
    if (!settings) {
      const defaultSettings = {
        email_enabled: true,
        email_cooldown_minutes: 5,
        max_emails_per_hour: 10,
        critical_only: false,
        quiet_hours_enabled: false,
        quiet_hours_start: "22:00",
        quiet_hours_end: "07:00"
      }

      return NextResponse.json({
        success: true,
        settings: defaultSettings
      })
    }

    return NextResponse.json({
      success: true,
      settings: {
        email_enabled: settings.email_enabled,
        email_cooldown_minutes: settings.email_cooldown_minutes,
        max_emails_per_hour: settings.max_emails_per_hour,
        critical_only: settings.critical_only,
        quiet_hours_enabled: settings.quiet_hours_enabled,
        quiet_hours_start: settings.quiet_hours_start,
        quiet_hours_end: settings.quiet_hours_end
      }
    })

  } catch (error) {
    console.error('Error obteniendo configuración:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

/**
 * POST - Actualizar configuración de notificaciones del usuario
 */
export async function POST(request: Request) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const {
      email_enabled,
      email_cooldown_minutes,
      max_emails_per_hour,
      critical_only,
      quiet_hours_enabled,
      quiet_hours_start,
      quiet_hours_end
    } = body

    // Validaciones
    if (email_cooldown_minutes && (email_cooldown_minutes < 5 || email_cooldown_minutes > 120)) {
      return NextResponse.json(
        { error: "El cooldown debe estar entre 5 y 120 minutos" },
        { status: 400 }
      )
    }

    if (max_emails_per_hour && (max_emails_per_hour < 1 || max_emails_per_hour > 10)) {
      return NextResponse.json(
        { error: "El máximo de emails por hora debe estar entre 1 y 10" },
        { status: 400 }
      )
    }

    // Preparar datos para guardar
    const settingsData = {
      user_id: authResult.userId,
      email_enabled: email_enabled ?? true,
      email_cooldown_minutes: email_cooldown_minutes ?? 5,
      max_emails_per_hour: max_emails_per_hour ?? 10,
      critical_only: critical_only ?? false,
      quiet_hours_enabled: quiet_hours_enabled ?? false,
      quiet_hours_start: quiet_hours_start ?? "22:00",
      quiet_hours_end: quiet_hours_end ?? "07:00"
    }

    // Usar upsert para insertar o actualizar
    const { data, error } = await supabase
      .from('user_notification_settings')
      .upsert(settingsData, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Error guardando configuración:', error)
      return NextResponse.json(
        { error: "Error al guardar configuración" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Configuración actualizada correctamente",
      settings: {
        email_enabled: data.email_enabled,
        email_cooldown_minutes: data.email_cooldown_minutes,
        max_emails_per_hour: data.max_emails_per_hour,
        critical_only: data.critical_only,
        quiet_hours_enabled: data.quiet_hours_enabled,
        quiet_hours_start: data.quiet_hours_start,
        quiet_hours_end: data.quiet_hours_end
      }
    })

  } catch (error) {
    console.error('Error actualizando configuración:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
