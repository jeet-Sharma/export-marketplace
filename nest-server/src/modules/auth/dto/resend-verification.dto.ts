import { IsEmail, MaxLength } from 'class-validator';

/** Request body for POST /auth/resend-verification. */
export class ResendVerificationDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;
}
