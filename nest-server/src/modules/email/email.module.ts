import { Module } from '@nestjs/common';
import { EmailService } from './email.service.js';

/**
 * Email delivery infrastructure. Kept independent from AuthModule so future
 * notifications, password resets, and invitations can reuse the same Gmail
 * SMTP service without coupling authentication to provider details.
 */
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
