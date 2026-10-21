import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the roles and permissions the product approval workflow
 * (Data_Modeling_Complete.md Part 3.1, ProductsService.review()) and the
 * inventory-management surface (Part 4, InventoryService.
 * assertCanManageInventory()) need to enforce "who may do what" —
 * additive only, does not modify SeedBuyerRole1732800000005 or any other
 * prior migration.
 *
 * Only what those two checks actually read is seeded here: VENDOR_MAKER,
 * VENDOR_CHECKER, VENDOR_OWNER, ADMIN roles (Part 2.11's table), the
 * `product.approve` and `inventory.manage` permissions, and the
 * role_permission rows that grant them. This is deliberately NOT the full
 * platform role/permission catalog (SUPER_ADMIN, OPS_MANAGER,
 * FINANCE_MANAGER, SUPPORT, or every other permission in Part 2.11) —
 * role.entity.ts's own comment calls the full bootstrap out as a
 * follow-up once the rest of the vendor/platform auth flows are built.
 * Widening this set later is additive, same as this migration is to
 * SeedBuyerRole.
 *
 * Per Part 2.11's "Starting permission set for vendor roles" table,
 * VENDOR_OWNER holds everything VENDOR_MAKER and VENDOR_CHECKER hold, so
 * it gets both product.approve (an owner with requires_second_approver
 * disabled is the one-person-vendor case Part 2.1's "Why" describes) and
 * inventory.manage (VENDOR_MAKER's own listed permission).
 */
export class SeedApprovalRoles1732800000007 implements MigrationInterface {
  name = 'SeedApprovalRoles1732800000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO role (code, name, scope_type, is_system, description) VALUES
        ('VENDOR_MAKER', 'Vendor Maker', 'VENDOR', true, 'Creates and edits products, manages inventory.'),
        ('VENDOR_CHECKER', 'Vendor Checker', 'VENDOR', true, 'Approves or rejects products at the Checker stage.'),
        ('VENDOR_OWNER', 'Vendor Owner', 'VENDOR', true, 'Everything a Maker and Checker can do, plus company management.'),
        ('ADMIN', 'Platform Admin', 'PLATFORM', true, 'Approves or rejects products at the Admin stage on behalf of the platform.')
    `);

    await queryRunner.query(`
      INSERT INTO permission (code, module, description) VALUES
        ('product.approve', 'Products', 'Approve or reject a product at the Checker or Admin review stage.'),
        ('inventory.manage', 'Inventory', 'Record manual stock adjustments/damage and resolve stock alerts.')
    `);

    await queryRunner.query(`
      INSERT INTO role_permission (role_id, permission_id)
      SELECT role.id, permission.id
        FROM role, permission
       WHERE role.code IN ('VENDOR_CHECKER', 'VENDOR_OWNER', 'ADMIN')
         AND permission.code = 'product.approve'
    `);

    await queryRunner.query(`
      INSERT INTO role_permission (role_id, permission_id)
      SELECT role.id, permission.id
        FROM role, permission
       WHERE role.code IN ('VENDOR_MAKER', 'VENDOR_OWNER')
         AND permission.code = 'inventory.manage'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Same dependency order as SeedBuyerRole's down(): role_permission
    // references both role and permission, and user_role references role,
    // so both must be cleared before the role/permission rows themselves.
    await queryRunner.query(`
      DELETE FROM role_permission
       WHERE permission_id IN (SELECT id FROM permission WHERE code IN ('product.approve', 'inventory.manage'))
    `);
    await queryRunner.query(`
      DELETE FROM user_role
       WHERE role_id IN (SELECT id FROM role WHERE code IN ('VENDOR_MAKER', 'VENDOR_CHECKER', 'VENDOR_OWNER', 'ADMIN'))
    `);
    await queryRunner.query(`DELETE FROM permission WHERE code IN ('product.approve', 'inventory.manage')`);
    await queryRunner.query(
      `DELETE FROM role WHERE code IN ('VENDOR_MAKER', 'VENDOR_CHECKER', 'VENDOR_OWNER', 'ADMIN')`,
    );
  }
}
