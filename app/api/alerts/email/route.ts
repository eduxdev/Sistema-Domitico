import { NextResponse } from "next/server"
import { enviarEmailPrueba, enviarAlertaGas } from "@/lib/email"
import { verifyAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

// Forzar renderizado dinámico para este endpoint
export const dynamic = 'force-dynamic'

/**
 * API Endpoint: Probar el envío de emails
 * GET /apis/notifications/email?email=tu@email.com&tipo=prueba
 * GET /apis/notifications/email?email=tu@email.com&tipo=alerta
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo') || 'prueba' // 'prueba' o 'alerta'
    
    // Obtener información del usuario autenticado
    const user = await verifyAuth(request)
    let email = searchParams.get('email')
    let nombreUsuario = 'Usuario'
    
    if (user) {
      // Obtener datos del usuario autenticado
      const { data: userData } = await supabase
        .from('usuarios')
        .select('email, nombre, apellidos')
        .eq('id', user.userId)
        .single()
      
      if (userData) {
        email = email || userData.email // Usar email del usuario si no se proporciona uno
        nombreUsuario = `${userData.nombre} ${userData.apellidos}`.trim()
      }
    }
    
    // Fallback al email de entorno si no hay usuario autenticado
    email = email || process.env.ALERT_EMAIL || null

    if (!email) {
      return NextResponse.json(
        { error: "No se pudo determinar el email de destino. Inicia sesión o proporciona un email: ?email=tu@email.com" },
        { status: 400 }
      )
    }

    let resultado

    if (tipo === 'alerta') {
      // Enviar email de alerta simulada
      resultado = await enviarAlertaGas({
        destinatario: email,
        nombreUsuario: nombreUsuario,
        nivelGas: 250,
        estado: 'peligro',
        alertasConsecutivas: 3,
        fechaHora: new Date().toLocaleString('es-MX', {
          timeZone: 'America/Mexico_City',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      })
    } else {
      // Enviar email de prueba
      resultado = await enviarEmailPrueba(email)
    }

    if (resultado.success) {
      return NextResponse.json({
        success: true,
        message: `Email de ${tipo} enviado exitosamente a ${email}`,
        emailId: resultado.data?.id
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Error enviando email",
          details: resultado.error
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error en test-email:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}




