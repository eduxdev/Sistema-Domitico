// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailData {
  to: string;
  deviceName: string;
  gasLevel: string;
  sensorValue: number;
  alertTime: string;
  userFullName: string;
}

export interface AlertaGasData {
  destinatario: string;
  nombreUsuario?: string;
  nivelGas: number;
  estado: string;
  alertasConsecutivas: number;
  fechaHora: string;
  sensorTipo?: string;
  unidad?: string;
}

export async function enviarEmailPrueba(destinatario: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Sistema Domótico <noreply@eduxdev.site>',
      to: [destinatario],
      subject: '✅ Prueba de Email - Sistema Domótico',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">✅ Prueba de Email Exitosa</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p style="font-size: 16px; margin-bottom: 15px;">
              ¡Hola! Este es un email de prueba del <strong>Sistema Domótico</strong>.
            </p>
            
            <div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
              <h3 style="color: #16a34a; margin-top: 0;">✅ Configuración Correcta</h3>
              <p style="margin: 10px 0;">
                Si recibes este email, significa que:
              </p>
              <ul style="margin: 10px 0;">
                <li>Tu configuración de Resend está funcionando</li>
                <li>Las variables de entorno están correctas</li>
                <li>El sistema puede enviar notificaciones</li>
              </ul>
            </div>
            
            <div style="background-color: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0;">
              <h3 style="color: #0284c7; margin-top: 0;">📋 Información del Sistema</h3>
              <ul style="margin: 10px 0;">
                <li><strong>Fecha de Prueba:</strong> ${new Date().toLocaleString('es-MX', {
                  timeZone: 'America/Mexico_City',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}</li>
                <li><strong>Destinatario:</strong> ${destinatario}</li>
                <li><strong>Estado:</strong> Sistema Operativo</li>
              </ul>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Este es un mensaje automático del Sistema Domótico. 
              No es necesario responder a este email.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error enviando email de prueba:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error en enviarEmailPrueba:', error);
    return { success: false, error };
  }
}

export async function enviarAlertaGas(alertaData: AlertaGasData) {
  try {
    // Determinar tipo de sensor y configurar mensaje
    const sensorTipo = alertaData.sensorTipo || 'Gas'
    const unidad = alertaData.unidad || 'PPM'
    const valor = alertaData.nivelGas
    
    // Configurar emoji y colores según el tipo de sensor
    let emoji = '🚨'
    let colorFondo = '#dc2626'
    let titulo = `ALERTA DE ${sensorTipo.toUpperCase()} DETECTADA`
    let descripcionAlerta = ''
    let accionesRecomendadas: string[] = []

    switch (sensorTipo) {
      case 'Gas':
        emoji = '🚨'
        descripcionAlerta = `Se ha detectado un <strong>NIVEL ELEVADO DE GAS</strong> en su sistema domótico.`
        accionesRecomendadas = [
          'Revise inmediatamente el área del sensor',
          'Ventile el espacio abriendo puertas y ventanas',
          'No encienda luces ni aparatos eléctricos',
          'Contacte a los servicios de emergencia si es necesario',
          'Verifique la fuente del gas'
        ]
        break
      case 'CO':
        emoji = '☠️'
        colorFondo = '#7c2d12'
        descripcionAlerta = `Se ha detectado un <strong>NIVEL PELIGROSO DE MONÓXIDO DE CARBONO</strong> en su sistema domótico.`
        accionesRecomendadas = [
          'EVACUE INMEDIATAMENTE el área',
          'Busque aire fresco al exterior',
          'Llame a los servicios de emergencia (911)',
          'No regrese hasta que el área sea segura',
          'Revise aparatos de combustión y ventilación'
        ]
        break
      case 'Temperatura':
        emoji = '🌡️'
        colorFondo = '#ea580c'
        descripcionAlerta = `Se ha detectado una <strong>TEMPERATURA PELIGROSA</strong> en su sistema domótico.`
        accionesRecomendadas = [
          'Revise inmediatamente el área del sensor',
          'Verifique posibles fuentes de calor',
          'Active sistemas de ventilación o aire acondicionado',
          'Revise equipos eléctricos por sobrecalentamiento',
          'Contacte a un técnico si persiste'
        ]
        break
      case 'Humedad':
        emoji = '💧'
        colorFondo = '#0369a1'
        descripcionAlerta = `Se ha detectado un <strong>NIVEL CRÍTICO DE HUMEDAD</strong> en su sistema domótico.`
        accionesRecomendadas = [
          'Active sistemas de deshumidificación',
          'Revise posibles fugas de agua',
          'Ventile el área para reducir humedad',
          'Verifique sistemas de drenaje',
          'Monitoree para prevenir moho'
        ]
        break
      default:
        descripcionAlerta = `Se ha detectado un <strong>NIVEL ANORMAL</strong> en el sensor ${sensorTipo}.`
        accionesRecomendadas = [
          'Revise inmediatamente el área del sensor',
          'Verifique las condiciones ambientales',
          'Contacte al soporte técnico si persiste'
        ]
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Sistema Domótico <noreply@eduxdev.site>',
      to: [alertaData.destinatario],
      subject: `${emoji} ALERTA DE ${sensorTipo.toUpperCase()} - Nivel ${alertaData.estado.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${colorFondo}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${emoji} ${titulo}</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p style="font-size: 16px; margin-bottom: 15px;">
              Estimado/a <strong>${alertaData.nombreUsuario || 'Usuario'}</strong>,
            </p>
            <p style="font-size: 16px; margin-bottom: 15px;">
              ${descripcionAlerta}
            </p>
            
            <div style="background-color: #fee2e2; border-left: 4px solid ${colorFondo}; padding: 15px; margin: 20px 0;">
              <h3 style="color: ${colorFondo}; margin-top: 0;">Detalles de la Alerta:</h3>
              <ul style="margin: 10px 0;">
                <li><strong>Sensor:</strong> ${sensorTipo}</li>
                <li><strong>Valor:</strong> ${valor} ${unidad}</li>
                <li><strong>Estado:</strong> ${alertaData.estado.toUpperCase()}</li>
                <li><strong>Alertas Consecutivas:</strong> ${alertaData.alertasConsecutivas}</li>
                <li><strong>Fecha y Hora:</strong> ${alertaData.fechaHora}</li>
              </ul>
            </div>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h3 style="color: #f59e0b; margin-top: 0;">⚠️ ACCIONES RECOMENDADAS:</h3>
              <ol style="margin: 10px 0;">
                ${accionesRecomendadas.map(accion => `<li>${accion}</li>`).join('')}
              </ol>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Este es un mensaje automático del Sistema Domótico. 
              Para más información, acceda a su panel de control.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error enviando email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error en enviarAlertaGas:', error);
    return { success: false, error };
  }
}

export async function sendDangerAlert(emailData: EmailData) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Sistema Domótico <noreply@eduxdev.site>',
      to: [emailData.to],
      subject: `🚨 ALERTA CRÍTICA - ${emailData.deviceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🚨 ALERTA CRÍTICA DE SEGURIDAD</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p style="font-size: 16px; margin-bottom: 15px;">
              Estimado/a <strong>${emailData.userFullName}</strong>,
            </p>
            
            <p style="font-size: 16px; margin-bottom: 15px;">
              Se ha detectado un <strong>NIVEL PELIGROSO DE GAS</strong> en su dispositivo 
              <strong>${emailData.deviceName}</strong> por más de 30 segundos.
            </p>
            
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin-top: 0;">Detalles de la Alerta:</h3>
              <ul style="margin: 10px 0;">
                <li><strong>Dispositivo:</strong> ${emailData.deviceName}</li>
                <li><strong>Nivel de Gas:</strong> ${emailData.gasLevel}</li>
                <li><strong>Valor del Sensor:</strong> ${emailData.sensorValue}</li>
                <li><strong>Hora de Detección:</strong> ${emailData.alertTime}</li>
              </ul>
            </div>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h3 style="color: #f59e0b; margin-top: 0;">⚠️ ACCIONES RECOMENDADAS:</h3>
              <ol style="margin: 10px 0;">
                <li>Evacue inmediatamente el área</li>
                <li>Ventile el espacio abriendo puertas y ventanas</li>
                <li>No encienda luces ni aparatos eléctricos</li>
                <li>Contacte a los servicios de emergencia si es necesario</li>
                <li>Revise la fuente del gas</li>
              </ol>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Este es un mensaje automático del Sistema Domótico. 
              Para más información, acceda a su panel de control.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error enviando email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error en sendDangerAlert:', error);
    return { success: false, error };
  }
}