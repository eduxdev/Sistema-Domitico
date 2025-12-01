import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { enviarAlertaGas } from "@/lib/email"
import { registrarNotificacion } from "@/lib/supabase/tablas"

// Configuración: Número máximo de lecturas a mantener
const MAX_LECTURAS = 10 // Cambia este número según necesites (10, 50, 100, etc.)

// Configuración de alertas
const ALERTAS_CONSECUTIVAS_REQUERIDAS = 2 // Enviar notificación después de 2-3 alertas seguidas
const NIVEL_ALERTA = 50 // PPM mínimo para considerar una alerta
const USAR_EMAIL = true // ✅ Email activado

/**
 * API Endpoint: Recibir datos del sensor
 * POST /apis/sensor/data
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { valor_ppm, sensor_nombre } = body

    // Validar que venga el valor
    if (typeof valor_ppm !== 'number') {
      return NextResponse.json(
        { error: "El campo valor_ppm es requerido y debe ser un número" },
        { status: 400 }
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
          sensor_nombre: sensor_nombre || 'Sensor Principal'
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
    await verificarAlertasConsecutivas(valor_ppm, estado)

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
 * Verifica si hay alertas consecutivas y envía email si es necesario
 */
async function verificarAlertasConsecutivas(valorActual: number, estadoActual: string) {
  try {
    // Solo verificar si el nivel actual es de alerta
    if (valorActual < NIVEL_ALERTA) {
      return
    }

    // Obtener las últimas lecturas
    const { data: ultimasLecturas, error } = await supabase
      .from('lecturas_gas')
      .select('*')
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

      // 📧 ENVIAR EMAIL (si está habilitado)
      if (USAR_EMAIL) {
        // Obtener TODOS los usuarios registrados
        const { data: usuarios, error: usuariosError } = await supabase
          .from('usuarios')
          .select('email, nombre, apellidos')
        
        if (usuariosError) {
          console.error('Error obteniendo usuarios:', usuariosError)
        } else if (usuarios && usuarios.length > 0) {
          // Enviar email a cada usuario
          for (const usuario of usuarios) {
            const nombreUsuario = `${usuario.nombre} ${usuario.apellidos}`.trim()

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
              asunto: `⚠️ Alerta de Gas - Nivel ${estadoActual.toUpperCase()}`,
              mensaje: `Nivel de gas: ${valorActual} PPM. ${alertasConsecutivas} alertas consecutivas.`,
              estado: resultadoEmail.success ? 'enviado' : 'fallido',
              lectura_id: ultimasLecturas[0]?.id,
              valor_ppm: valorActual,
              nivel_alerta: estadoActual,
              respuesta_api: resultadoEmail.success ? JSON.stringify(resultadoEmail.data) : undefined,
              error_mensaje: resultadoEmail.success ? undefined : (typeof resultadoEmail.error === 'string' ? resultadoEmail.error : JSON.stringify(resultadoEmail.error))
            })

            if (!resultadoEmail.success) {
              console.error(`Error enviando email a ${usuario.email}:`, resultadoEmail.error)
            }
          }
        } else {
          // Fallback: usar ALERT_EMAIL si no hay usuarios
          const emailFallback = process.env.ALERT_EMAIL
          if (emailFallback) {
            const resultadoEmail = await enviarAlertaGas({
              destinatario: emailFallback,
              nombreUsuario: 'Administrador',
              nivelGas: valorActual,
              estado: estadoActual,
              alertasConsecutivas: alertasConsecutivas,
              fechaHora: fechaHora
            })

            await registrarNotificacion({
              tipo: 'email',
              destinatario: emailFallback,
              asunto: `⚠️ Alerta de Gas - Nivel ${estadoActual.toUpperCase()}`,
              mensaje: `Nivel de gas: ${valorActual} PPM. ${alertasConsecutivas} alertas consecutivas.`,
              estado: resultadoEmail.success ? 'enviado' : 'fallido',
              lectura_id: ultimasLecturas[0]?.id,
              valor_ppm: valorActual,
              nivel_alerta: estadoActual,
              respuesta_api: resultadoEmail.success ? JSON.stringify(resultadoEmail.data) : undefined,
              error_mensaje: resultadoEmail.success ? undefined : (typeof resultadoEmail.error === 'string' ? resultadoEmail.error : JSON.stringify(resultadoEmail.error))
            })

            if (!resultadoEmail.success) {
              console.error('Error enviando email fallback:', resultadoEmail.error)
            }
          }
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

    const { data, error } = await supabase
      .from('lecturas_gas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

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
