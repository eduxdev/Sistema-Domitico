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

    console.log('Email de prueba enviado exitosamente:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error en enviarEmailPrueba:', error);
    return { success: false, error };
  }
}

export async function enviarAlertaGas(alertaData: AlertaGasData) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Sistema Domótico <noreply@eduxdev.site>',
      to: [alertaData.destinatario],
      subject: `🚨 ALERTA DE GAS - Nivel ${alertaData.estado.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">🚨 ALERTA DE GAS DETECTADA</h1>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p style="font-size: 16px; margin-bottom: 15px;">
              Estimado/a <strong>${alertaData.nombreUsuario || 'Usuario'}</strong>,
            </p>
            <p style="font-size: 16px; margin-bottom: 15px;">
              Se ha detectado un <strong>NIVEL ELEVADO DE GAS</strong> en su sistema domótico.
            </p>
            
            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin-top: 0;">Detalles de la Alerta:</h3>
              <ul style="margin: 10px 0;">
                <li><strong>Nivel de Gas:</strong> ${alertaData.nivelGas} PPM</li>
                <li><strong>Estado:</strong> ${alertaData.estado.toUpperCase()}</li>
                <li><strong>Alertas Consecutivas:</strong> ${alertaData.alertasConsecutivas}</li>
                <li><strong>Fecha y Hora:</strong> ${alertaData.fechaHora}</li>
              </ul>
            </div>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h3 style="color: #f59e0b; margin-top: 0;">⚠️ ACCIONES RECOMENDADAS:</h3>
              <ol style="margin: 10px 0;">
                <li>Revise inmediatamente el área del sensor</li>
                <li>Ventile el espacio abriendo puertas y ventanas</li>
                <li>No encienda luces ni aparatos eléctricos</li>
                <li>Contacte a los servicios de emergencia si es necesario</li>
                <li>Verifique la fuente del gas</li>
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

    console.log('Email enviado exitosamente:', data);
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

    console.log('Email enviado exitosamente:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error en sendDangerAlert:', error);
    return { success: false, error };
  }
}