import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enforces "at most one primary image per product" at the DB level via a
 * partial unique index, rather than relying solely on the application's
 * demote-then-insert sequence in ProductsService.addImage (which is not
 * atomic against a concurrent second request also setting isPrimary=true
 * for the same product — see the code review that flagged this gap).
 *
 * A plain UNIQUE(product_id, is_primary) would be wrong here: it would
 * also forbid more than one is_primary=false row per product, which is
 * the common case (every non-primary image). The partial index only
 * applies WHERE is_primary = true, so it uniquely constrains just the
 * "is this product's primary image" slot.
 */
export class AddProductImagePrimaryUniqueIndex1759751600000 implements MigrationInterface {
  name = 'AddProductImagePrimaryUniqueIndex1759751600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_product_images_product_id_primary"
      ON "product_images" ("product_id")
      WHERE "is_primary" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_product_images_product_id_primary"`);
  }
}
