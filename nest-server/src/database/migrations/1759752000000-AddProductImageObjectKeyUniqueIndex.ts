import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Enforces "a storage object key belongs to at most one product image row"
 * at the DB level, closing a gap flagged in code review: without this,
 * two ProductImage rows could reference the same s3_object_key (e.g. a
 * client replaying/duplicating a POST .../images call with the same
 * objectKey, or two concurrent requests racing on the same key). Deleting
 * either of those rows via removeImage() then deletes the shared storage
 * object, leaving the other row's image permanently broken (metadata
 * pointing at a now-deleted object) with no error ever surfaced.
 *
 * A plain application-level "does this key already exist?" check (added
 * alongside this migration in ProductsService.addImage) catches the
 * common case but is not safe against two concurrent requests both
 * passing that check before either inserts — the same
 * check-then-insert race already called out for
 * UQ_product_images_product_id_primary. This unique index is the actual
 * guarantee; the application check only exists to turn the common case
 * into a clean error without needing to lose the race first.
 */
export class AddProductImageObjectKeyUniqueIndex1759752000000
  implements MigrationInterface
{
  name = 'AddProductImageObjectKeyUniqueIndex1759752000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_product_images_s3_object_key"
      ON "product_images" ("s3_object_key")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_product_images_s3_object_key"`);
  }
}
