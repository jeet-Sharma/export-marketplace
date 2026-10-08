import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the `country.create` permission introduced alongside
 * POST /countries, and grants it to PLATFORM_ADMIN — same idempotent
 * (ON CONFLICT DO NOTHING) pattern as SeedAdminRoleAndUser and
 * AddVendorCategoryCreatePermissions.
 *
 * Permissions are embedded in the JWT access token at login time (see
 * PermissionsGuard's comment in permissions.guard.ts) rather than
 * re-queried per request, so an admin who logged in before this
 * migration ran must log in again to receive a token carrying this new
 * permission code.
 */
export class AddCountryCreatePermission1759751900000 implements MigrationInterface {
  name = 'AddCountryCreatePermission1759751900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("code", "name", "description")
      VALUES ('country.create', 'Create Country', 'Create a country.')
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r."code" = 'PLATFORM_ADMIN'
        AND p."code" = 'country.create'
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (SELECT "id" FROM "permissions" WHERE "code" = 'country.create')
    `);
    await queryRunner.query(
      `DELETE FROM "permissions" WHERE "code" = 'country.create'`,
    );
  }
}
