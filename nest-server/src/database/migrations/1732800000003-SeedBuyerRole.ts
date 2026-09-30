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
export class SeedBuyerRole1732800000003 implements MigrationInterface {
  name = 'SeedBuyerRole1732800000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO role (code, name, scope_type, is_system, description)
      VALUES ('BUYER', 'Buyer', 'BUYER', true, 'Every buyer, assigned automatically at signup — no approval, no choice.')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the dependent user_role assignments FIRST. Once any buyer has
    // registered, user_role.role_id references this role, and deleting the
    // role directly would fail on that foreign key — breaking
    // migration:revert. Reverting this seed necessarily un-assigns the BUYER
    // role from every user that has it (there is no other role for them to
    // fall back to; the seed and its assignments are one logical unit).
    await queryRunner.query(`
      DELETE FROM user_role
       WHERE role_id = (SELECT id FROM role WHERE code = 'BUYER')
    `);
    await queryRunner.query(`DELETE FROM role WHERE code = 'BUYER'`);
  }
}
