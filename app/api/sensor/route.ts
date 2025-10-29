import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { SensorReading } from '@/lib/database.types'

export async function GET() {
  try {
    // Obtener el último registro del sensor ordenado por timestamp descendente
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error al obtener datos del sensor:', error)
      return NextResponse.json(
        { error: 'Error al obtener datos del sensor' },
        { status: 500 }
      )
    }

    // Devolver el último registro
    return NextResponse.json({
      success: true,
      data: data as SensorReading,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
