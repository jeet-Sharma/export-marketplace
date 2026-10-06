import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

/**
 * Request body for PATCH /buyers/me. Every field is optional — only the keys
 * present are updated (partial update).
 *
 * Deliberately NOT accepted here (the global ValidationPipe's
 * forbidNonWhitelisted rejects them with a 400 if sent):
 *  - email: the login identity; changing it needs its own verified flow.
 *  - isVerified / status: set by platform/verification logic, never by the
 *    buyer editing their own profile (security-rules.md: don't trust a
 *    client-supplied flag for anything authorization-relevant).
 *  - taxIdEnc: encrypted at rest, KMS integration deferred (Part 2.9).
 *
 * The BUSINESS-requires-companyName rule is a cross-field invariant that
 * also depends on the currently-stored buyerType, so it's enforced in
 * BuyersService against the merged state, not with a decorator here.
 */
export class UpdateBuyerProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsIn(['INDIVIDUAL', 'BUSINESS'])
  buyerType?: 'INDIVIDUAL' | 'BUSINESS';

  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string;

  // ISO 3166-1 alpha-2, matches the d_country domain (Data_Modeling_Complete.md
  // Part 0.3) — same rule as RegisterBuyerDto.
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'country must be a 2-letter ISO 3166-1 alpha-2 code, e.g. US, IN' })
  country?: string;

  // ISO 4217, matches the d_ccy domain.
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'preferredCurrency must be a 3-letter ISO 4217 code, e.g. USD, INR' })
  preferredCurrency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  preferredLanguage?: string;
}
