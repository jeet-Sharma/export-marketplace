import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

/** Request body for POST /auth/verify-email. */
export class VerifyEmailDto {
  @IsString()
  @MinLength(64)
  @MaxLength(64)
  @Matches(/^[0-9a-f]{64}$/, { message: 'token must be a valid verification token' })
  token!: string;
}
