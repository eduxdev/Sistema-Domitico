import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { enviarAlertaGas } from "@/lib/email"
import { registrarNotificacion } from "@/lib/supabase/tablas"
import { Tables } from "@/lib/database.types"

// Configuración de alertas
const ALERTAS_CONSECUTIVAS_REQUERIDAS = 2
const USAR_EMAIL = true

// Configuración de cooldown para emails (valores por defecto)
// Estos valores se pueden sobrescribir con la configuración del usuario
const DEFAULT_EMAIL_COOLDOWN_MINUTES = 5  // 5 minutos entre emails
const DEFAULT_MAX_EMAILS_PER_HOUR = 10    // Máximo 10 emails por hora

// Umbrales de seguridad para cada sensor
type UmbralSimple = { seguro: number; peligro: number }
type UmbralRango = { min_seguro: number; max_seguro: number; peligro: number }

const UMBRALES: Record<string, UmbralSimple | UmbralRango> = {
  MQ2: { seguro: 300, peligro: 600 }, // Gas
  MQ4: { seguro: 50, peligro: 150 },  // CO
  DHT11_temp: { min_seguro: 18, max_seguro: 28, peligro: 35 }, // Temperatura
  DHT11_hum: { min_seguro: 30, max_seguro: 70, peligro: 85 }   // Humedad
}

interface SensorReading {
  tipo: string
  valor: number
  unidad: string
  nombre: string
}

interface MultiSensorData {
  device_id: string
  sensores: SensorReading[]
  estado_general: string
  alertas_activas: string
}

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
 * Determina el estado de un sensor basado en su tipo y valor
 */
function determinarEstadoSensor(tipo: string, valor: number): string {
  const umbral = UMBRALES[tipo]
  
  if (!umbral) return 'normal'

  switch (tipo) {
    case 'MQ2':
    case 'MQ4':
      const umbralSimple = umbral as UmbralSimple
      if (valor >= umbralSimple.peligro) return 'peligro'
      if (valor >= umbralSimple.seguro) return 'precaucion'
      return 'normal'

    case 'DHT11_temp':
    case 'DHT11_hum':
      const umbralRango = umbral as UmbralRango
      if (valor >= umbralRango.peligro) return 'peligro'
      if (valor < umbralRango.min_seguro || valor > umbralRango.max_seguro) return 'precaucion'
      return 'normal'

    default:
      return 'normal'
  }
}

/**
 * Verifica alertas consecutivas para un sensor específico
 */
async function verificarAlertasConsecutivas(
  sensor: SensorReading,
  lectura: { id: number },
  estadoActual: string,
  deviceId: string,
  dispositivo: Tables<'dispositivos'> & { usuarios?: { email: string; nombre: string; apellidos: string } | null }
) {
  try {
    // Obtener las últimas lecturas del sensor específico
    const { data: ultimasLecturas, error } = await supabase
      .from('lecturas_sensores')
      .select('*')
      .eq('device_id', deviceId)
      .eq('sensor_tipo', sensor.tipo)
      .order('created_at', { ascending: false })
      .limit(ALERTAS_CONSECUTIVAS_REQUERIDAS + 1)

    if (error || !ultimasLecturas) {
      console.error('Error obteniendo últimas lecturas:', error)
      return
    }

    // Contar alertas consecutivas
    let alertasConsecutivas = 0
    for (const lectura of ultimasLecturas) {
      if (lectura.estado !== 'normal') {
        alertasConsecutivas++
      } else {
        break
      }
    }

    // Si hay alertas consecutivas suficientes, enviar notificación
    if (alertasConsecutivas >= ALERTAS_CONSECUTIVAS_REQUERIDAS) {
      await enviarNotificacionSensor(
        sensor,
        estadoActual,
        alertasConsecutivas,
        deviceId,
        dispositivo,
        lectura
      )
    }

  } catch (error) {
    console.error('Error verificando alertas consecutivas:', error)
  }
}

/**
 * Envía notificación por email para un sensor específico
 */
async function enviarNotificacionSensor(
  sensor: SensorReading,
  estadoActual: string,
  alertasConsecutivas: number,
  deviceId: string,
  dispositivo: Tables<'dispositivos'> & { usuarios?: { email: string; nombre: string; apellidos: string } | null },
  lecturaData: { id: number }
) {
  if (!USAR_EMAIL || !dispositivo.is_claimed || !dispositivo.usuarios) {
    return
  }

  const usuario = dispositivo.usuarios
  const nombreUsuario = `${usuario.nombre} ${usuario.apellidos}`.trim()

  // Verificar cooldown
  // Verificar cooldown por dispositivo completo, no por sensor individual
  const cooldownCheck = await puedeEnviarEmail(deviceId, usuario.email)
  
  if (!cooldownCheck.puede) {
    // Registrar que se bloqueó por cooldown (sin lectura_id)
    try {
      await registrarNotificacion({
        tipo: 'email',
        destinatario: usuario.email,
        asunto: `Alerta ${sensor.nombre} bloqueada - ${dispositivo.nombre}`,
        mensaje: `Dispositivo: ${dispositivo.nombre} (${deviceId}). Sensor: ${sensor.nombre}. Valor: ${sensor.valor} ${sensor.unidad}. Bloqueado: ${cooldownCheck.razon}`,
        estado: 'fallido',
        lectura_id: undefined, // No usar lectura_id para evitar foreign key constraint
        valor_ppm: Math.round(sensor.valor),
        nivel_alerta: estadoActual,
        error_mensaje: cooldownCheck.razon
      })
    } catch (error) {
      console.error('Error registrando notificación bloqueada:', error)
    }
    return
  }

  // Crear mensaje personalizado según el tipo de sensor
  const fechaHora = new Date().toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  let tipoAlerta = 'normal'
  let asuntoEmail = `⚠️ Alerta ${sensor.nombre} - ${dispositivo.nombre}`
  
  if (estadoActual === 'peligro') {
    tipoAlerta = 'critica'
    asuntoEmail = `🚨 ALERTA CRÍTICA ${sensor.nombre} - ${dispositivo.nombre}`
  }

  // Enviar email personalizado según el sensor
  const resultadoEmail = await enviarAlertaGas({
    destinatario: usuario.email,
    nombreUsuario: nombreUsuario,
    nivelGas: Math.round(sensor.valor),
    estado: estadoActual,
    alertasConsecutivas: alertasConsecutivas,
    fechaHora: fechaHora,
    sensorTipo: sensor.nombre,
    unidad: sensor.unidad
  })

  // Registrar notificación (sin lectura_id para evitar foreign key constraint)
  try {
    await registrarNotificacion({
      tipo: 'email',
      destinatario: usuario.email,
      asunto: asuntoEmail,
      mensaje: `Dispositivo: ${dispositivo.nombre} (${deviceId}). Sensor: ${sensor.nombre}. Valor: ${sensor.valor} ${sensor.unidad}. ${alertasConsecutivas} alertas consecutivas. Tipo: ${tipoAlerta}.`,
      estado: resultadoEmail.success ? 'enviado' : 'fallido',
        lectura_id: undefined, // No usar lectura_id para evitar foreign key constraint
      valor_ppm: Math.round(sensor.valor),
      nivel_alerta: estadoActual,
      respuesta_api: resultadoEmail.success ? JSON.stringify(resultadoEmail.data) : undefined,
      error_mensaje: resultadoEmail.success ? undefined : (typeof resultadoEmail.error === 'string' ? resultadoEmail.error : JSON.stringify(resultadoEmail.error))
    })
  } catch (error) {
    console.error('Error registrando notificación:', error)
  }
}

/**
 * Obtener configuración de notificaciones del usuario
 */
async function obtenerConfiguracionUsuario(usuarioEmail: string) {
  try {
    // Buscar el user_id por email
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

    // Obtener configuración del usuario
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

/**
 * Verifica cooldown para emails usando configuración del usuario
 */
async function puedeEnviarEmail(deviceId: string, usuarioEmail: string): Promise<{ puede: boolean; razon?: string }> {
  try {
    // Obtener configuración del usuario
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

    // Verificar último email para este dispositivo (cualquier sensor)
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

    // Verificar cooldown
    const ultimoEmail = new Date(ultimasNotificaciones[0].created_at || '')
    if (ultimoEmail > cooldownTime) {
      const minutosRestantes = Math.ceil((ultimoEmail.getTime() + (config.email_cooldown_minutes * 60 * 1000) - ahora.getTime()) / (60 * 1000))
      return { 
        puede: false, 
        razon: `Cooldown activo (${config.email_cooldown_minutes} min). Próximo email en ${minutosRestantes} minutos.`
      }
    }

    // Verificar límite por hora
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

/**
 * Limpia lecturas antiguas automáticamente - Mantiene máximo 50 registros
 */
async function limpiarLecturasAntiguas() {
  try {
    const MAX_LECTURAS_TOTALES = 50

    const { count: totalCount } = await supabase
      .from('lecturas_sensores')
      .select('*', { count: 'exact', head: true })

    if (totalCount && totalCount > MAX_LECTURAS_TOTALES) {
      const lecturasAEliminar = totalCount - MAX_LECTURAS_TOTALES
      
      const { data: lecturasViejas } = await supabase
        .from('lecturas_sensores')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(lecturasAEliminar)

      if (lecturasViejas && lecturasViejas.length > 0) {
        const idsAEliminar = lecturasViejas.map(l => l.id)
        await supabase
          .from('lecturas_sensores')
          .delete()
          .in('id', idsAEliminar)
      }
    }
  } catch (error) {
    console.error('Error en limpieza automática:', error)
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
