/**
 * Response shape for POST /auth/register. Deliberately minimal — never
 * echoes password_hash, the raw user_token, or any other internal column
 * (see storage/UploadFileResponseDto for the established "plain typed
 * response class" pattern this follows).
 *
 * No session/JWT is issued here: registration alone does not log the buyer
 * in (Data_Modeling_Complete.md Part 12.2 — email verification comes
 * first). Login is a separate endpoint, not built in this pass.
 */
export class RegisterBuyerResponseDto {
  id!: string;
  fullName!: string;
  email!: string;
  status!: 'PENDING';
}
