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

    // Configuración por defecto
    const defaultSettings = {
      email_enabled: true,
      email_cooldown_minutes: 15,
      max_emails_per_hour: 4,
      critical_only: false,
      quiet_hours_enabled: false,
      quiet_hours_start: "22:00",
      quiet_hours_end: "07:00"
    }

    // TODO: En el futuro, obtener de una tabla de configuración de usuario
    // Por ahora, devolver configuración por defecto
    return NextResponse.json({
      success: true,
      settings: defaultSettings
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

    // TODO: En el futuro, guardar en tabla de configuración de usuario
    // Por ahora, solo validar y devolver éxito
    
    return NextResponse.json({
      success: true,
      message: "Configuración actualizada correctamente",
      settings: {
        email_enabled: email_enabled ?? true,
        email_cooldown_minutes: email_cooldown_minutes ?? 15,
        max_emails_per_hour: max_emails_per_hour ?? 4,
        critical_only: critical_only ?? false,
        quiet_hours_enabled: quiet_hours_enabled ?? false,
        quiet_hours_start: quiet_hours_start ?? "22:00",
        quiet_hours_end: quiet_hours_end ?? "07:00"
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
