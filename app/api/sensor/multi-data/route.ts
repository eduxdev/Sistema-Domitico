import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { MultiSensorData } from './types'
import { determinarEstadoSensor } from './sensor-utils'
import { limpiarLecturasAntiguas } from './cleanup'
import { verificarAlertasConsecutivas } from './notifications'

/**
 * API Endpoint: Recibir datos de múltiples sensores
 * POST /api/sensor/multi-data
 */
export async function POST(request: Request) {
  try {
    const body: MultiSensorData = await request.json()
    const { device_id, sensores } = body

    // Validar datos requeridos
    if (!device_id || !sensores || !Array.isArray(sensores)) {
      return NextResponse.json(
        { error: "Faltan datos requeridos: device_id y sensores" },
        { status: 400 }
      )
    }

    // Verificar que el dispositivo existe y está reclamado
    const { data: dispositivo } = await supabase
      .from('dispositivos')
      .select('*, usuarios:claimed_by(email, nombre, apellidos)')
      .eq('device_id', device_id)
      .single()

    if (!dispositivo) {
      return NextResponse.json(
        { error: "Dispositivo no registrado" },
        { status: 404 }
      )
    }

    // Procesar cada sensor independientemente
    const lecturas_insertadas = []
    const sensores_en_alerta = []

    for (const sensor of sensores) {
      const { tipo, valor, unidad, nombre } = sensor

      // Determinar estado del sensor individual
      const estadoSensor = determinarEstadoSensor(tipo, valor)
      
      // Insertar lectura en la base de datos
      const { data: lectura, error } = await supabase
        .from('lecturas_sensores')
        .insert([
          {
            device_id: device_id,
            sensor_tipo: tipo,
            valor: valor,
            unidad: unidad,
            estado: estadoSensor,
            sensor_nombre: nombre
          }
        ])
        .select()
        .single()

      if (error) {
        console.error(`Error insertando lectura ${tipo}:`, error)
        continue
      }

      lecturas_insertadas.push(lectura)

      // Solo enviar emails cuando esté en PELIGRO (no por precaución)
      if (estadoSensor === 'peligro') {
        sensores_en_alerta.push({ sensor, lectura, estado: estadoSensor })
      }
    }

    // Limpiar lecturas antiguas (cada 10 inserciones aprox)
    if (Math.random() < 0.1) { // 10% de probabilidad
      await limpiarLecturasAntiguas()
    }

    // Verificar alertas consecutivas para cada sensor en alerta
    for (const sensorAlerta of sensores_en_alerta) {
      await verificarAlertasConsecutivas(
        sensorAlerta.sensor,
        sensorAlerta.lectura,
        sensorAlerta.estado,
        device_id,
        dispositivo
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        lecturas_insertadas: lecturas_insertadas.length,
        sensores_procesados: sensores.length,
        sensores_en_alerta: sensores_en_alerta.length
      },
      message: "Lecturas multi-sensor guardadas correctamente"
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (error) {
    console.error('Error en API multi-sensor:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

/**
 * GET: Obtener lecturas de múltiples sensores
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const deviceId = searchParams.get('device_id') || undefined
    const sensorTipo = searchParams.get('sensor_tipo') || undefined

    let query = supabase
      .from('lecturas_sensores')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (deviceId) {
      query = query.eq('device_id', deviceId)
    }

    if (sensorTipo) {
      query = query.eq('sensor_tipo', sensorTipo)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error obteniendo lecturas multi-sensor:', error)
      return NextResponse.json(
        { error: "Error al obtener lecturas" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (error) {
    console.error('Error en API GET multi-sensor:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}


/**
 * OPTIONS para CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  })
}
