import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryImageAndProductExpiryDate1759752100000
  implements MigrationInterface
{
  name = 'AddCategoryImageAndProductExpiryDate1759752100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "categories"
      ADD COLUMN IF NOT EXISTS "image" varchar(500) NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN IF NOT EXISTS "expiry_date" date NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN IF EXISTS "expiry_date";
    `);

    await queryRunner.query(`
      ALTER TABLE "categories"
      DROP COLUMN IF EXISTS "image";
    `);
  }
}
