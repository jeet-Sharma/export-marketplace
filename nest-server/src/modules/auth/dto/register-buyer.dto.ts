import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * Request body for POST /auth/register (buyer registration only).
 *
 * Mirrors Data_Modeling_Complete.md Part 12.2 ("Buyer registration — John
 * signs up"): a buyer needs just full_name, email and a password to create
 * their `users` row; country/preferred_currency seed their `buyer_profile`.
 * Everything else in that flow (user_role BUYER, user_token EMAIL_VERIFY)
 * is derived server-side, not supplied by the client.
 *
 * Uses class-validator (see main.ts's global ValidationPipe) rather than
 * the manual `if (!x) throw new BadRequestException()` checks used by
 * storage/messaging — this is the first DTO in the project to do so; see
 * backend-rules.md for why that's a deliberate, flagged architectural
 * choice rather than an ad-hoc one.
 */
export class RegisterBuyerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName!: string;

  @IsEmail()
  @MaxLength(320) // RFC 5321 max mailbox length
  email!: string;

  // Deliberately not over-engineered (no upper/lower/symbol composition
  // rules): length is the one password-strength signal with real evidence
  // behind it. argon2id (see AuthService) makes brute-forcing a long
  // passphrase impractical regardless of character variety.
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  // ISO 3166-1 alpha-2, matches the d_country domain (Data_Modeling_Complete.md
  // Part 0.3). Optional at signup — Part 12.2 shows it seeded from the form,
  // but a buyer isn't blocked from registering without it.
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'country must be a 2-letter ISO 3166-1 alpha-2 code, e.g. US, IN' })
  country?: string;

  // ISO 4217, matches the d_ccy domain.
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'preferredCurrency must be a 3-letter ISO 4217 code, e.g. USD, INR' })
  preferredCurrency?: string;
}
