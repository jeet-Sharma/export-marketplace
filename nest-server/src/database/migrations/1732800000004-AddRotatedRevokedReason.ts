import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds 'ROTATED' to auth_session.revoked_reason's allowed values.
 *
 * Refresh-token rotation (AuthService.refreshTokens) revokes the presented
 * session and mints a fresh one on every refresh. That revocation is normal
 * use, not a logout — recording it as 'LOGOUT' (the only previously-allowed
 * "voluntary" reason) made the audit trail read every token refresh as the
 * user signing out. 'ROTATED' keeps the two distinct.
 *
 * Separate migration (not an edit to CreateCompaniesPeopleAccess) because
 * that migration is already applied and pushed — its CHECK constraint must
 * be altered forward, never rewritten in place.
 */
export class AddRotatedRevokedReason1732800000004 implements MigrationInterface {
  name = 'AddRotatedRevokedReason1732800000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE auth_session DROP CONSTRAINT IF EXISTS auth_session_revoked_reason_check`);
    await queryRunner.query(`
      ALTER TABLE auth_session ADD CONSTRAINT auth_session_revoked_reason_check
        CHECK (revoked_reason IS NULL OR revoked_reason IN ('LOGOUT','ROTATED','USER_BLOCKED','PASSWORD_CHANGED','ADMIN'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the original set. Any existing 'ROTATED' rows would violate the
    // narrower constraint, so fold them back to 'LOGOUT' first (the closest
    // pre-existing voluntary-revocation reason) to keep the revert valid.
    await queryRunner.query(`UPDATE auth_session SET revoked_reason = 'LOGOUT' WHERE revoked_reason = 'ROTATED'`);
    await queryRunner.query(`ALTER TABLE auth_session DROP CONSTRAINT IF EXISTS auth_session_revoked_reason_check`);
    await queryRunner.query(`
      ALTER TABLE auth_session ADD CONSTRAINT auth_session_revoked_reason_check
        CHECK (revoked_reason IS NULL OR revoked_reason IN ('LOGOUT','USER_BLOCKED','PASSWORD_CHANGED','ADMIN'))
    `);
  }
}
