import { ServiceUnavailableException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import type { MailConfig } from '../../config/mail.config.js';

export interface VerificationEmailInput {
  email: string;
  fullName: string;
  token: string;
}

/**
 * Gmail SMTP email delivery.
 *
 * This service owns provider-specific mail configuration and message
 * formatting. AuthService should pass the raw verification token here only
 * after its database transaction commits; the token is never stored or
 * logged by this service. Gmail credentials are read through ConfigService
 * and are never included in logs or responses.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly mailConfig: MailConfig;
  private readonly transporter: Transporter;

  constructor(configService: ConfigService) {
    this.mailConfig = configService.get<MailConfig>('mail')!;
    this.transporter = nodemailer.createTransport({
      host: this.mailConfig.host,
      port: this.mailConfig.port,
      secure: this.mailConfig.port === 465,
      auth: {
        user: this.mailConfig.user,
        pass: this.mailConfig.password,
      },
    });
  }

  async sendVerificationEmail(input: VerificationEmailInput): Promise<void> {
    if (!this.mailConfig.user || !this.mailConfig.password || !this.mailConfig.from) {
      this.logger.error('Email delivery is not configured. Set MAIL_USER, MAIL_PASSWORD, and MAIL_FROM.');
      throw new ServiceUnavailableException('Email delivery is not configured.');
    }

    const verificationUrl = `${this.mailConfig.frontendUrl}/verify-email?token=${encodeURIComponent(input.token)}`;

    try {
      await this.transporter.sendMail({
        from: this.mailConfig.from,
        to: input.email,
        subject: 'Verify your Export Marketplace email',
        text: [
          `Hello ${input.fullName},`,
          '',
          'Please verify your Export Marketplace email address using this link:',
          verificationUrl,
          '',
          'This link expires in 1 hour. If you did not create this account, you can ignore this email.',
        ].join('\n'),
        html: `
          <p>Hello ${this.escapeHtml(input.fullName)},</p>
          <p>Please verify your Export Marketplace email address:</p>
          <p><a href="${verificationUrl}">Verify email address</a></p>
          <p>This link expires in 1 hour. If you did not create this account, you can ignore this email.</p>
        `,
      });
    } catch (error) {
      this.logger.error('Email delivery failed.', error instanceof Error ? error.stack : undefined);
      throw new ServiceUnavailableException('Email delivery is temporarily unavailable.');
    }
  }

  private escapeHtml(value: string): string {
    return value.replace(
      /[&<>'"]/g,
      (character) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character,
    );
  }
}
