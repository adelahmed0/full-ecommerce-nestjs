import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendPasswordResetCode(email: string, code: string, name?: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset your password',
        template: 'password-reset',
        context: {
          name,
          code,
          appName: 'Ecommerce',
          expiresInMinutes: 10,
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send reset code to ${email}`, error);
      throw error instanceof Error ? error : new Error('Failed to send email');
    }
  }
}
