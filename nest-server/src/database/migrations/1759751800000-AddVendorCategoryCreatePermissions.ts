import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the `vendor.create` and `category.create` permissions introduced
 * alongside POST /admin/vendors and POST /categories, and grants both to
 * PLATFORM_ADMIN — same idempotent (ON CONFLICT DO NOTHING) pattern as
 * SeedAdminRoleAndUser.
 *
 * Permissions are embedded in the JWT access token at login time (see
 * PermissionsGuard's comment in permissions.guard.ts) rather than
 * re-queried per request, so an admin who logged in before this
 * migration ran must log in again to receive a token carrying these two
 * new permission codes.
 */
export class AddVendorCategoryCreatePermissions1759751800000 implements MigrationInterface {
  name = 'AddVendorCategoryCreatePermissions1759751800000';

  private readonly permissions: Array<{
    code: string;
    name: string;
    description: string;
  }> = [
    {
      code: 'vendor.create',
      name: 'Create Vendor',
      description: 'Create a vendor/supplier.',
    },
    {
      code: 'category.create',
      name: 'Create Category',
      description: 'Create a product category.',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const permission of this.permissions) {
      await queryRunner.query(
        `
        INSERT INTO "permissions" ("code", "name", "description")
        VALUES ($1, $2, $3)
        ON CONFLICT ("code") DO NOTHING
      `,
        [permission.code, permission.name, permission.description],
      );
    }

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r."code" = 'PLATFORM_ADMIN'
        AND p."code" IN ('vendor.create', 'category.create')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT "id" FROM "permissions" WHERE "code" IN ('vendor.create', 'category.create')
      )
    `);
    await queryRunner.query(
      `DELETE FROM "permissions" WHERE "code" IN ('vendor.create', 'category.create')`,
    );
  }
}
