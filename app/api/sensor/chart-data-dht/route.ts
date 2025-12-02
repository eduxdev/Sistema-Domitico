import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAuth } from "@/lib/auth"

/**
 * API Endpoint: Obtener datos en tiempo real para DHT11 (Temperatura y Humedad)
 * GET /api/sensor/chart-data-dht
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
    const limit = parseInt(searchParams.get('limit') || '10')

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

    // Obtener las últimas lecturas de temperatura y humedad
    const { data: lecturas, error } = await supabase
      .from('lecturas_sensores')
      .select('*')
      .in('device_id', deviceIds)
      .in('sensor_tipo', ['DHT11_temp', 'DHT11_hum'])
      .order('created_at', { ascending: false })
      .limit(limit * 2)

    if (error) {
      console.error('Error obteniendo datos DHT11:', error)
      return NextResponse.json(
        { error: "Error al obtener datos" },
        { status: 500 }
      )
    }

    // Agrupar por timestamp
    const groupedByTime: { [key: string]: { temp?: number; hum?: number } } = {}

    lecturas?.forEach((lectura) => {
      if (!lectura.created_at) return
      
      const date = new Date(lectura.created_at)
      const roundedTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                                   date.getHours(), date.getMinutes()).toISOString()
      
      if (!groupedByTime[roundedTime]) {
        groupedByTime[roundedTime] = {}
      }

      if (lectura.sensor_tipo === 'DHT11_temp') {
        groupedByTime[roundedTime].temp = Math.round(lectura.valor * 10) / 10
      } else if (lectura.sensor_tipo === 'DHT11_hum') {
        groupedByTime[roundedTime].hum = Math.round(lectura.valor * 10) / 10
      }
    })

    // Convertir a formato de gráfica
    const chartData = Object.entries(groupedByTime)
      .filter(([_, values]) => values.temp !== undefined && values.hum !== undefined)
      .map(([time, values]) => ({
        time,
        temperatura: values.temp || 0,
        humedad: values.hum || 0
      }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .slice(-limit)

    return NextResponse.json({
      success: true,
      data: chartData
    })

  } catch (error) {
    console.error('Error en API chart-data-dht:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
