import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { enviarAlertaGas } from "@/lib/email"
import { registrarNotificacion } from "@/lib/supabase/tablas"
import { Tables } from "@/lib/database.types"

// Configuración: Número máximo de lecturas a mantener
const MAX_LECTURAS = 10 // Cambia este número según necesites (10, 50, 100, etc.)

// Configuración de alertas
const ALERTAS_CONSECUTIVAS_REQUERIDAS = 2 // Enviar notificación después de 2-3 alertas seguidas
const NIVEL_ALERTA = 50 // PPM mínimo para considerar una alerta
const USAR_EMAIL = true // ✅ Email activado

// Configuración de cooldown para emails (evitar spam)
const EMAIL_COOLDOWN_MINUTES = 15 // No enviar más de 1 email cada 15 minutos por dispositivo
const MAX_EMAILS_PER_HOUR = 4 // Máximo 4 emails por hora por dispositivo
// const EMAIL_ESCALATION_MINUTES = 60 // Enviar email de escalación después de 1 hora sin resolución (futuro)

/**
 * API Endpoint: Recibir datos del sensor
 * POST /apis/sensor/data
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { valor_ppm, sensor_nombre, device_id } = body

    // Validar que venga el valor
    if (typeof valor_ppm !== 'number') {
      return NextResponse.json(
        { error: "El campo valor_ppm es requerido y debe ser un número" },
        { status: 400 }
      )
    }

    // Validar que venga el device_id
    if (!device_id) {
      return NextResponse.json(
        { error: "El campo device_id es requerido" },
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

    // Determinar el estado según el valor
    let estado = 'normal'
    if (valor_ppm >= 50 && valor_ppm <= 90) {
      estado = 'precaucion'
    } else if (valor_ppm >= 91) {
      estado = 'peligro'
    }

    // Insertar en la base de datos
    const { data, error } = await supabase
      .from('lecturas_gas')
      .insert([
        {
          valor_ppm: valor_ppm,
          estado: estado,
          sensor_nombre: sensor_nombre || 'Sensor Principal',
          device_id: device_id
        }
      ])
      .select()

    if (error) {
      console.error('Error insertando lectura:', error)
      return NextResponse.json(
        { error: "Error al guardar la lectura" },
        { status: 500 }
      )
    }

    // 🗑️ LIMPIEZA AUTOMÁTICA: Eliminar lecturas antiguas
    await limpiarLecturasAntiguas()

    // 📧 DETECCIÓN DE ALERTAS: Verificar si hay alertas consecutivas
    await verificarAlertasConsecutivas(valor_ppm, estado, device_id, dispositivo)

    return NextResponse.json({
      success: true,
      data: data[0],
      message: "Lectura guardada correctamente"
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (error) {
    console.error('Error en API:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

/**
 * Elimina las lecturas antiguas manteniendo solo las últimas MAX_LECTURAS
 */
async function limpiarLecturasAntiguas() {
  try {
    // Contar cuántas lecturas hay
    const { count, error: countError } = await supabase
      .from('lecturas_gas')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error contando lecturas:', countError)
      return
    }

    // Si hay más lecturas del límite, eliminar las más antiguas
    if (count && count > MAX_LECTURAS) {
      const lecturasAEliminar = count - MAX_LECTURAS

      // Obtener los IDs de las lecturas más antiguas
      const { data: lecturasViejas, error: fetchError } = await supabase
        .from('lecturas_gas')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(lecturasAEliminar)

      if (fetchError) {
        console.error('Error obteniendo lecturas viejas:', fetchError)
        return
      }

      if (lecturasViejas && lecturasViejas.length > 0) {
        const idsAEliminar = lecturasViejas.map(l => l.id)

        // Eliminar las lecturas antiguas
        const { error: deleteError } = await supabase
          .from('lecturas_gas')
          .delete()
          .in('id', idsAEliminar)

        if (deleteError) {
          console.error('Error eliminando lecturas:', deleteError)
        }
      }
    }
  } catch (error) {
    console.error('Error en limpieza automática:', error)
  }
}

/**
 * Verifica si se puede enviar un email (cooldown para evitar spam)
 */
async function puedeEnviarEmail(deviceId: string, usuarioEmail: string): Promise<{ puede: boolean; razon?: string; ultimoEmail?: Date }> {
  try {
    const ahora = new Date()
    const cooldownTime = new Date(ahora.getTime() - (EMAIL_COOLDOWN_MINUTES * 60 * 1000))
    const hourAgo = new Date(ahora.getTime() - (60 * 60 * 1000))

    // Verificar último email enviado para este dispositivo
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
      return { puede: true } // En caso de error, permitir envío
    }

    if (!ultimasNotificaciones || ultimasNotificaciones.length === 0) {
      return { puede: true } // No hay emails previos, permitir
    }

    // Verificar cooldown (último email hace menos de X minutos)
    const ultimoEmail = new Date(ultimasNotificaciones[0].created_at || '')
    if (ultimoEmail > cooldownTime) {
      const minutosRestantes = Math.ceil((ultimoEmail.getTime() + (EMAIL_COOLDOWN_MINUTES * 60 * 1000) - ahora.getTime()) / (60 * 1000))
      return { 
        puede: false, 
        razon: `Cooldown activo. Próximo email en ${minutosRestantes} minutos.`,
        ultimoEmail 
      }
    }

    // Verificar límite por hora
    const emailsUltimaHora = ultimasNotificaciones.filter(notif => 
      new Date(notif.created_at || '') > hourAgo
    ).length

    if (emailsUltimaHora >= MAX_EMAILS_PER_HOUR) {
      return { 
        puede: false, 
        razon: `Límite de ${MAX_EMAILS_PER_HOUR} emails por hora alcanzado.`,
        ultimoEmail 
      }
    }

    return { puede: true, ultimoEmail }
  } catch (error) {
    console.error('Error en verificación de cooldown:', error)
    return { puede: true } // En caso de error, permitir envío
  }
}

/**
 * Verifica si hay alertas consecutivas y envía email si es necesario
 */
async function verificarAlertasConsecutivas(valorActual: number, estadoActual: string, deviceId: string, dispositivo: Tables<'dispositivos'> & { usuarios?: { email: string; nombre: string; apellidos: string } | null }) {
  try {
    // Solo verificar si el nivel actual es de alerta
    if (valorActual < NIVEL_ALERTA) {
      return
    }

    // Obtener las últimas lecturas del dispositivo específico
    const { data: ultimasLecturas, error } = await supabase
      .from('lecturas_gas')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(ALERTAS_CONSECUTIVAS_REQUERIDAS + 1)

    if (error || !ultimasLecturas) {
      console.error('Error obteniendo últimas lecturas:', error)
      return
    }

    // Contar cuántas alertas consecutivas hay
    let alertasConsecutivas = 0
    for (const lectura of ultimasLecturas) {
      if (lectura.valor_ppm >= NIVEL_ALERTA) {
        alertasConsecutivas++
      } else {
        break // Si encuentra una lectura normal, rompe la secuencia
      }
    }

    // Si hay 2 o más alertas consecutivas, enviar notificaciones
    if (alertasConsecutivas >= ALERTAS_CONSECUTIVAS_REQUERIDAS) {
      const fechaHora = new Date().toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      // 📧 ENVIAR EMAIL (si está habilitado y dispositivo está reclamado)
      if (USAR_EMAIL && dispositivo.is_claimed && dispositivo.usuarios) {
        const usuario = dispositivo.usuarios
        const nombreUsuario = `${usuario.nombre} ${usuario.apellidos}`.trim()

        // Verificar cooldown antes de enviar
        const cooldownCheck = await puedeEnviarEmail(deviceId, usuario.email)
        
        if (cooldownCheck.puede) {
          // Determinar tipo de alerta basado en severidad y tiempo
          let tipoAlerta = 'normal'
          let asuntoEmail = `⚠️ Alerta de Gas - ${dispositivo.nombre}`
          
          if (estadoActual === 'peligro') {
            tipoAlerta = 'critica'
            asuntoEmail = `🚨 ALERTA CRÍTICA - ${dispositivo.nombre}`
          } else if (alertasConsecutivas >= 5) {
            tipoAlerta = 'persistente'
            asuntoEmail = `⚠️ Alerta Persistente - ${dispositivo.nombre}`
          }

          const resultadoEmail = await enviarAlertaGas({
            destinatario: usuario.email,
            nombreUsuario: nombreUsuario,
            nivelGas: valorActual,
            estado: estadoActual,
            alertasConsecutivas: alertasConsecutivas,
            fechaHora: fechaHora
          })

          // Registrar notificación en la base de datos
          await registrarNotificacion({
            tipo: 'email',
            destinatario: usuario.email,
            asunto: asuntoEmail,
            mensaje: `Dispositivo: ${dispositivo.nombre} (${deviceId}). Nivel de gas: ${valorActual} PPM. ${alertasConsecutivas} alertas consecutivas. Tipo: ${tipoAlerta}.`,
            estado: resultadoEmail.success ? 'enviado' : 'fallido',
            lectura_id: ultimasLecturas[0]?.id,
            valor_ppm: valorActual,
            nivel_alerta: estadoActual,
            respuesta_api: resultadoEmail.success ? JSON.stringify(resultadoEmail.data) : undefined,
            error_mensaje: resultadoEmail.success ? undefined : (typeof resultadoEmail.error === 'string' ? resultadoEmail.error : JSON.stringify(resultadoEmail.error))
          })

          if (!resultadoEmail.success) {
            console.error(`❌ Error enviando email a ${usuario.email}:`, resultadoEmail.error)
          }
        } else {
          // Registrar que se bloqueó por cooldown
          await registrarNotificacion({
            tipo: 'email',
            destinatario: usuario.email,
            asunto: `Alerta bloqueada - ${dispositivo.nombre}`,
            mensaje: `Dispositivo: ${dispositivo.nombre} (${deviceId}). Nivel: ${valorActual} PPM. Bloqueado: ${cooldownCheck.razon}`,
            estado: 'fallido',
            lectura_id: ultimasLecturas[0]?.id,
            valor_ppm: valorActual,
            nivel_alerta: estadoActual,
            error_mensaje: cooldownCheck.razon
          })
        }
      }
    }

  } catch (error) {
    console.error('Error verificando alertas consecutivas:', error)
  }
}

/**
 * Endpoint para obtener las últimas lecturas
 * GET /apis/sensor/data?limit=10
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const deviceId = searchParams.get('device_id')

    let query = supabase
      .from('lecturas_gas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Filtrar por device_id si se proporciona
    if (deviceId) {
      query = query.eq('device_id', deviceId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error obteniendo lecturas:', error)
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
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (error) {
    console.error('Error en API:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}

/**
 * Endpoint OPTIONS para CORS (ESP32)
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
