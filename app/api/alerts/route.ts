import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener alertas del usuario con información del dispositivo
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select(`
        id,
        alert_type,
        message,
        sensor_value,
        gas_level,
        is_sent,
        notification_type,
        warning_start_time,
        notification_sent_at,
        is_resolved,
        resolved_at,
        created_at,
        updated_at,
        device:devices (
          id,
          device_name,
          device_id,
          device_type
        )
      `)
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      alerts: alerts || []
    })

  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

