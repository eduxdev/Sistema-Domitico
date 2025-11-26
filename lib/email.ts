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