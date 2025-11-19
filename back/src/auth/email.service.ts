import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }
  }

  async sendVerificationEmail(
    to: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

    const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');
    const fromName = this.configService.get<string>('SENDGRID_FROM_NAME');

    if (!fromEmail) {
      throw new Error('SENDGRID_FROM_EMAIL is not defined');
    }

    const msg = {
      to,
      from: {
        email: fromEmail,
        name: fromName || 'MediConnect',
      },
      subject: 'Verificá tu cuenta en MediConnect',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>¡Bienvenido/a a MediConnect! 🏥</h1>
            </div>
            <div class="content">
              <h2>Hola ${firstName},</h2>
              <p>Gracias por registrarte en MediConnect. Para completar tu registro, necesitamos que verifiques tu dirección de email.</p>
              <p>Por favor, hacé clic en el siguiente botón para verificar tu cuenta:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verificar mi cuenta</a>
              </div>
              <p style="color: #666; font-size: 14px;">O copiá y pegá este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">Este enlace expirará en 24 horas.</p>
            </div>
            <div class="footer">
              <p>Si no creaste esta cuenta, podés ignorar este email.</p>
              <p>&copy; ${new Date().getFullYear()} MediConnect - Clínica Médica Integral</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Verification email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${to}:`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(
    to: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');
    const fromName = this.configService.get<string>('SENDGRID_FROM_NAME');

    if (!fromEmail) {
      throw new Error('SENDGRID_FROM_EMAIL is not defined');
    }

    const msg = {
      to,
      from: {
        email: fromEmail,
        name: fromName || 'MediConnect',
      },
      subject: 'Restablecé tu contraseña - MediConnect',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Restablecer Contraseña 🔒</h1>
            </div>
            <div class="content">
              <h2>Hola ${firstName},</h2>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en MediConnect.</p>
              <p>Si realizaste esta solicitud, hacé clic en el siguiente botón para crear una nueva contraseña:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
              </div>
              <p style="color: #666; font-size: 14px;">O copiá y pegá este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              <div class="warning">
                <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por seguridad.
              </div>
              <p style="color: #999; font-size: 12px;">Si no solicitaste este cambio, podés ignorar este email. Tu contraseña permanecerá sin cambios.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} MediConnect - Clínica Médica Integral</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Error sending password reset email to ${to}:`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');
    const fromName = this.configService.get<string>('SENDGRID_FROM_NAME');

    if (!fromEmail) {
      throw new Error('SENDGRID_FROM_EMAIL is not defined');
    }

    const msg = {
      to,
      from: {
        email: fromEmail,
        name: fromName || 'MediConnect',
      },
      subject: '¡Cuenta verificada exitosamente! - MediConnect',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ¡Cuenta Verificada!</h1>
            </div>
            <div class="content">
              <h2>¡Hola ${firstName}!</h2>
              <p>Tu cuenta ha sido verificada exitosamente. Ahora podés disfrutar de todos los beneficios de MediConnect:</p>
              
              <div class="feature">
                <strong>📅 Reservar Turnos</strong><br>
                Agendá tus consultas médicas de forma rápida y sencilla.
              </div>
              
              <div class="feature">
                <strong>📋 Historial Médico</strong><br>
                Accedé a tu historial clínico completo en cualquier momento.
              </div>
              
              <div class="feature">
                <strong>💬 Chat en Vivo</strong><br>
                Comunicate directamente con nuestro personal de recepción.
              </div>
              
              <div class="feature">
                <strong>🔔 Recordatorios</strong><br>
                Recibí notificaciones antes de tus turnos programados.
              </div>
              
              <p style="margin-top: 30px;">Gracias por confiar en MediConnect para tu cuidado de salud.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} MediConnect - Clínica Médica Integral</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Error sending welcome email to ${to}:`, error);
      throw error;
    }
  }
}