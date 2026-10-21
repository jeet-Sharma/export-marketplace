import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the one `role` row that buyer registration (POST /auth/register)
 * structurally depends on: every buyer gets the BUYER role automatically at
 * signup (Data_Modeling_Complete.md Part 2.11 "Starting permission set for
 * vendor roles" table; Part 12.2 registration flow — `user_role BUYER`).
 *
 * This is deliberately NOT the full role/permission bootstrap (SUPER_ADMIN,
 * VENDOR_OWNER, VENDOR_MAKER, VENDOR_CHECKER, ADMIN, etc., or any
 * role_permission rows) — role.entity.ts's own comment calls that out as a
 * follow-up once the auth layer exists. The auth layer now exists for
 * buyers only, so only the row buyers need is added here. The rest of the
 * role catalog is added when the vendor/platform auth flows are built.
 */
export class SeedBuyerRole1732800000005 implements MigrationInterface {
  name = 'SeedBuyerRole1732800000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO role (code, name, scope_type, is_system, description)
      VALUES ('BUYER', 'Buyer', 'BUYER', true, 'Every buyer, assigned automatically at signup — no approval, no choice.')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete any assignments first — once buyer registration has run,
    // user_role rows reference this role.id via a FK, so deleting the role
    // row first would fail on that constraint. Reverting this migration
    // means "the BUYER role no longer exists", which also means nobody can
    // hold it anymore, so removing the assignments is part of the same
    // rollback, not a separate concern.
    await queryRunner.query(
      `DELETE FROM user_role WHERE role_id = (SELECT id FROM role WHERE code = 'BUYER')`,
    );
    await queryRunner.query(`DELETE FROM role WHERE code = 'BUYER'`);
  }
}
