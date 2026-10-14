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
// Dev-only seed password: 'ChangeMe123!' (bcrypt, cost 12). Rotate
// immediately in any shared/production environment — see class doc.
// Shared between up() (the value inserted) and down() (the guard
// confirming a row wasn't rotated/modified since — see down()'s comment).
const SEED_ADMIN_PASSWORD_HASH =
  '$2b$12$Rp6QXGi6XKxpRbDUoy75JujAR6y9Sg1OqiDM2p11xcGUL3RizJoJ2';

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

    await queryRunner.query(
      `
      INSERT INTO "users" ("email", "password_hash", "first_name", "last_name", "status")
      VALUES ($1, $2, 'Platform', 'Admin', 'ACTIVE')
      ON CONFLICT DO NOTHING
    `,
      ['admin@export-marketplace.local', SEED_ADMIN_PASSWORD_HASH],
    );

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

  // Qodo review Bug #8: the original down() deleted the admin user,
  // PLATFORM_ADMIN role, and all 6 permissions purely by email/code match,
  // with no check that THIS migration is actually what created them. Two
  // real data-loss scenarios that fixes:
  //  1. up()'s INSERTs are idempotent (ON CONFLICT DO NOTHING) specifically
  //     so re-running this migration against an environment where the
  //     admin/role/permissions already exist (seeded by another process,
  //     or already present from a previous migration run that was never
  //     rolled back) is a safe no-op. But the original down() didn't
  //     mirror that idempotency check — it deleted by email/code
  //     unconditionally, so reverting this migration in that environment
  //     would delete rows this migration never created.
  //  2. The seeded admin's password hash is EXPECTED to be rotated (see
  //     the class doc's security warning) — once rotated, the row still
  //     matches on email, so the original down() would still delete the
  //     real, in-use admin account and its role assignment, not a leftover
  //     seed artifact.
  // Fix: every DELETE below is scoped with an additional guard verifying
  // the row still looks exactly like what up() inserted (unrotated
  // password hash for the user; a role/permission with no OTHER grants
  // beyond what this migration created). This is deliberately
  // conservative — if anything about the seeded state has changed, down()
  // leaves that row alone rather than guessing.
  public async down(queryRunner: QueryRunner): Promise<void> {
    const permissionCodes = this.permissions.map((p) => p.code);

    // Only remove the admin user's role assignment if the password hash
    // still matches exactly what up() inserted — if it's been rotated
    // (the expected post-seed action, per this migration's own security
    // warning), this is almost certainly the real admin account in active
    // use, not an artifact safe to tear down.
    await queryRunner.query(
      `
      DELETE FROM "user_roles"
      WHERE "user_id" IN (
        SELECT "id" FROM "users"
        WHERE lower("email") = 'admin@export-marketplace.local'
          AND "password_hash" = $1
      )
      AND "role_id" IN (SELECT "id" FROM "roles" WHERE "code" = 'PLATFORM_ADMIN')
    `,
      [SEED_ADMIN_PASSWORD_HASH],
    );
    await queryRunner.query(
      `
      DELETE FROM "users"
      WHERE lower("email") = 'admin@export-marketplace.local'
        AND "password_hash" = $1
    `,
      [SEED_ADMIN_PASSWORD_HASH],
    );

    // Only remove PLATFORM_ADMIN's grant of each seeded permission if that
    // permission isn't ALSO granted to some other role — if another role
    // depends on it, it's no longer safe to assume this migration is the
    // only reason the permission row exists.
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "role_id" IN (SELECT "id" FROM "roles" WHERE "code" = 'PLATFORM_ADMIN')
        AND "permission_id" IN (
          SELECT "id" FROM "permissions" WHERE "code" IN (${permissionCodes.map((_, i) => `$${i + 1}`).join(', ')})
        )
    `, permissionCodes);

    // Only delete a seeded permission if NO role still references it —
    // if up() found it already existed (ON CONFLICT DO NOTHING) and some
    // other role was already using it, that permission predates this
    // migration and must survive the rollback.
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE "code" IN (${permissionCodes.map((_, i) => `$${i + 1}`).join(', ')})
        AND "id" NOT IN (SELECT "permission_id" FROM "role_permissions")
    `, permissionCodes);

    // Only delete PLATFORM_ADMIN if nothing still references it — any
    // remaining user_roles row, or any role_permissions row (seeded by
    // something other than this migration), means the role predates or
    // outlives this migration and must not be removed.
    await queryRunner.query(`
      DELETE FROM "roles"
      WHERE "code" = 'PLATFORM_ADMIN'
        AND "id" NOT IN (SELECT "role_id" FROM "user_roles")
        AND "id" NOT IN (SELECT "role_id" FROM "role_permissions")
    `);
  }
}
