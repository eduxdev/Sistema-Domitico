import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAuth } from "@/lib/auth"

/**
 * API Endpoint: Obtener datos en tiempo real para MQ4 (CO)
 * GET /api/sensor/chart-data-mq4
 */
export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Obtener dispositivos del usuario
    const { data: dispositivos } = await supabase
      .from('dispositivos')
      .select('device_id')
      .eq('claimed_by', user.userId)
      .eq('is_claimed', true)

    if (!dispositivos || dispositivos.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const deviceIds = dispositivos.map(d => d.device_id)

    // Obtener las últimas lecturas del sensor MQ4
    const { data: lecturas, error } = await supabase
      .from('lecturas_sensores')
      .select('*')
      .in('device_id', deviceIds)
      .eq('sensor_tipo', 'MQ4')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error obteniendo datos MQ4:', error)
      return NextResponse.json(
        { error: "Error al obtener datos" },
        { status: 500 }
      )
    }

    // Convertir a formato de gráfica
    const chartData = lecturas?.map((lectura) => ({
      time: lectura.created_at,
      valor: Math.round(lectura.valor)
    })).reverse() || []

    return NextResponse.json({
      success: true,
      data: chartData
    })

  } catch (error) {
    console.error('Error en API chart-data-mq4:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
