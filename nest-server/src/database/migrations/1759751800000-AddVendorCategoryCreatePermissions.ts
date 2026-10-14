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

  // Qodo review Bug #9: the original down() deleted BOTH permissions and
  // EVERY role_permissions grant referencing them, purely by code match —
  // with no check that this migration is what created them. up() is
  // idempotent (ON CONFLICT DO NOTHING), so re-running this migration
  // against an environment where 'vendor.create'/'category.create'
  // already existed (seeded by another process, or granted to a role
  // other than PLATFORM_ADMIN since) is a safe no-op — but the original
  // down() didn't mirror that: it would delete those pre-existing grants
  // and permission rows too, including grants to roles this migration
  // never touched.
  //
  // Fix: only revoke PLATFORM_ADMIN's specific grant (not any other
  // role's), and only delete a permission row once NO role_permissions
  // reference it at all — if some other role was already granted it
  // before this migration ran, that grant (and the permission row it
  // depends on) must survive the rollback.
  public async down(queryRunner: QueryRunner): Promise<void> {
    const permissionCodes = this.permissions.map((p) => p.code);
    const placeholders = permissionCodes.map((_, i) => `$${i + 1}`).join(', ');

    await queryRunner.query(
      `
      DELETE FROM "role_permissions"
      WHERE "role_id" IN (SELECT "id" FROM "roles" WHERE "code" = 'PLATFORM_ADMIN')
        AND "permission_id" IN (
          SELECT "id" FROM "permissions" WHERE "code" IN (${placeholders})
        )
    `,
      permissionCodes,
    );

    await queryRunner.query(
      `
      DELETE FROM "permissions"
      WHERE "code" IN (${placeholders})
        AND "id" NOT IN (SELECT "permission_id" FROM "role_permissions")
    `,
      permissionCodes,
    );
  }
}
