import { supabase } from "@/lib/supabase"
import { enviarAlertaGas } from "@/lib/email"
import { registrarNotificacion } from "@/lib/supabase/tablas"
import { Tables } from "@/lib/database.types"
import { SensorReading } from './types'
import { ALERTAS_CONSECUTIVAS_REQUERIDAS, USAR_EMAIL } from './config'
import { puedeEnviarEmail } from './cooldown'

/**
 * Verifica alertas consecutivas para un sensor específico
 */
export async function verificarAlertasConsecutivas(
  sensor: SensorReading,
  lectura: { id: number },
  estadoActual: string,
  deviceId: string,
  dispositivo: Tables<'dispositivos'> & { usuarios?: { email: string; nombre: string; apellidos: string } | null }
) {
  try {
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

    let alertasConsecutivas = 0
    for (const lectura of ultimasLecturas) {
      if (lectura.estado !== 'normal') {
        alertasConsecutivas++
      } else {
        break
      }
    }

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

  const cooldownCheck = await puedeEnviarEmail(deviceId, usuario.email)
  
  if (!cooldownCheck.puede) {
    try {
      await registrarNotificacion({
        tipo: 'email',
        destinatario: usuario.email,
        asunto: `Alerta ${sensor.nombre} bloqueada - ${dispositivo.nombre}`,
        mensaje: `Dispositivo: ${dispositivo.nombre} (${deviceId}). Sensor: ${sensor.nombre}. Valor: ${sensor.valor} ${sensor.unidad}. Bloqueado: ${cooldownCheck.razon}`,
        estado: 'fallido',
        lectura_id: undefined,
        valor_ppm: Math.round(sensor.valor),
        nivel_alerta: estadoActual,
        error_mensaje: cooldownCheck.razon
      })
    } catch (error) {
      console.error('Error registrando notificación bloqueada:', error)
    }
    return
  }

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

  try {
    await registrarNotificacion({
      tipo: 'email',
      destinatario: usuario.email,
      asunto: asuntoEmail,
      mensaje: `Dispositivo: ${dispositivo.nombre} (${deviceId}). Sensor: ${sensor.nombre}. Valor: ${sensor.valor} ${sensor.unidad}. ${alertasConsecutivas} alertas consecutivas. Tipo: ${tipoAlerta}.`,
      estado: resultadoEmail.success ? 'enviado' : 'fallido',
      lectura_id: undefined,
      valor_ppm: Math.round(sensor.valor),
      nivel_alerta: estadoActual,
      respuesta_api: resultadoEmail.success ? JSON.stringify(resultadoEmail.data) : undefined,
      error_mensaje: resultadoEmail.success ? undefined : (typeof resultadoEmail.error === 'string' ? resultadoEmail.error : JSON.stringify(resultadoEmail.error))
    })
  } catch (error) {
    console.error('Error registrando notificación:', error)
  }
}
