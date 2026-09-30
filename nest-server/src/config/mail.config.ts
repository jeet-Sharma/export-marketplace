import { registerAs } from '@nestjs/config';

export interface MailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
  frontendUrl: string;
}

/**
 * Gmail SMTP configuration, namespaced under "mail" in ConfigService.
 *
 * Credentials are read from environment variables by this factory and are
 * never logged. The email service validates that credentials exist only when
 * a message is sent, so an optional email provider cannot prevent the API
 * from booting in tests or local development.
 */
export default registerAs('mail', (): MailConfig => {
  const user = process.env.MAIL_USER ?? '';

  return {
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    user,
    password: process.env.MAIL_PASSWORD ?? '',
    from: process.env.MAIL_FROM ?? user,
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  };
});
