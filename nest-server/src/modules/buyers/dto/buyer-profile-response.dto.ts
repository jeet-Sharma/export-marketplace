/**
 * Response shape for GET/PATCH /buyers/me.
 *
 * Combines the identity fields a buyer is allowed to see about their own
 * `users` row (id/publicId/email/fullName/phone) with their editable
 * `buyer_profile`. Deliberately omits password_hash, status flags, tax_id_enc
 * (encrypted, KMS deferred) and anything the buyer neither owns nor edits —
 * plain typed class matching the existing response-DTO style (api-rules.md).
 */
export class BuyerProfileResponseDto {
  id!: string;
  publicId!: string;
  email!: string;
  fullName!: string;
  phone!: string | null;
  buyerType!: 'INDIVIDUAL' | 'BUSINESS';
  companyName!: string | null;
  country!: string | null;
  preferredCurrency!: string | null;
  preferredLanguage!: string | null;
  isVerified!: boolean;
}
