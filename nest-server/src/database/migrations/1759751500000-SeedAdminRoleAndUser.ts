import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the minimum data needed to log in and manage the Phase 1 product
 * catalogue: one PLATFORM_ADMIN role, the 6 recommended permissions from
 * Phase-1-API-Specification-v0.1 section 3, the role/permission mapping,
 * and one admin user.
 *
 * This is a one-time dev/initial-environment seed, not a repeatable
 * reference-data load — it's written to be idempotent (ON CONFLICT DO
 * NOTHING) so re-running migrations never duplicates rows or fails, but it
 * does not update an already-seeded admin's password/role on re-run.
 *
 * SECURITY: the seeded password below is a dev-only placeholder
 * ('ChangeMe123!', bcrypt-hashed with cost 12). Anyone running this
 * migration against a shared/production environment must rotate this
 * password immediately after first login — never rely on this seed value
 * past initial local setup.
 */
export class SeedAdminRoleAndUser1759751500000 implements MigrationInterface {
  name = 'SeedAdminRoleAndUser1759751500000';

  // Permissions recommended in Phase-1-API-Specification-v0.1 section 3.
  private readonly permissions: Array<{
    code: string;
    name: string;
    description: string;
  }> = [
    {
      code: 'product.view',
      name: 'View Products',
      description: 'View admin product records, including drafts.',
    },
    {
      code: 'product.create',
      name: 'Create Product',
      description: 'Create a product.',
    },
    {
      code: 'product.edit',
      name: 'Edit Product',
      description: 'Edit product data.',
    },
    {
      code: 'product.publish',
      name: 'Publish Product',
      description: 'Publish a draft product.',
    },
    {
      code: 'product.unpublish',
      name: 'Unpublish Product',
      description: 'Unpublish a published product.',
    },
    {
      code: 'vendor.view',
      name: 'View Vendors',
      description: 'Read supplier/vendor master data for product assignment.',
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "roles" ("code", "name", "description", "is_system")
      VALUES ('PLATFORM_ADMIN', 'Platform Admin', 'Full administrative access to Phase 1 platform management APIs.', true)
      ON CONFLICT ("code") DO NOTHING
    `);

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

    // Map every seeded permission to PLATFORM_ADMIN.
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r."id", p."id"
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r."code" = 'PLATFORM_ADMIN'
        AND p."code" IN ('product.view', 'product.create', 'product.edit', 'product.publish', 'product.unpublish', 'vendor.view')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    // Dev-only seed password: 'ChangeMe123!' (bcrypt, cost 12). Rotate
    // immediately in any shared/production environment — see class doc.
    await queryRunner.query(`
      INSERT INTO "users" ("email", "password_hash", "first_name", "last_name", "status")
      VALUES (
        'admin@export-marketplace.local',
        '$2b$12$Rp6QXGi6XKxpRbDUoy75JujAR6y9Sg1OqiDM2p11xcGUL3RizJoJ2',
        'Platform',
        'Admin',
        'ACTIVE'
      )
      ON CONFLICT DO NOTHING
    `);

    // Assign PLATFORM_ADMIN to the seeded admin user.
    await queryRunner.query(`
      INSERT INTO "user_roles" ("user_id", "role_id")
      SELECT u."id", r."id"
      FROM "users" u
      CROSS JOIN "roles" r
      WHERE lower(u."email") = 'admin@export-marketplace.local'
        AND r."code" = 'PLATFORM_ADMIN'
      ON CONFLICT ("user_id", "role_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "user_roles"
      WHERE "user_id" IN (SELECT "id" FROM "users" WHERE lower("email") = 'admin@export-marketplace.local')
    `);
    await queryRunner.query(`
      DELETE FROM "users" WHERE lower("email") = 'admin@export-marketplace.local'
    `);
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "role_id" IN (SELECT "id" FROM "roles" WHERE "code" = 'PLATFORM_ADMIN')
    `);
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "code" IN ('product.view', 'product.create', 'product.edit', 'product.publish', 'product.unpublish', 'vendor.view')
    `);
    await queryRunner.query(
      `DELETE FROM "roles" WHERE "code" = 'PLATFORM_ADMIN'`,
    );
  }
}
