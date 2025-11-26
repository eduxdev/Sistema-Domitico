import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { device_id, ip_address } = await request.json()
    
    if (!device_id) {
      return NextResponse.json(
        { error: 'device_id es requerido' },
        { status: 400 }
      )
    }

    // Actualizar last_seen del dispositivo
    const { data, error } = await supabase
      .from('devices')
      .update({
        last_seen: new Date().toISOString(),
        ip_address: ip_address,
        is_active: true
      })
      .eq('device_id', device_id)
      .select()

    if (error) {
      return NextResponse.json(
        { error: 'Error actualizando dispositivo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Heartbeat recibido',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
