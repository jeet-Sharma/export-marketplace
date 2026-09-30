import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the minimum reference data that Catalog (product.category_id,
 * product.base_currency) and Auth/buyer registration (buyer_profile.country,
 * buyer_profile.preferred_currency) structurally depend on via NOT NULL /
 * nullable foreign keys — see product.entity.ts, buyer-profile.entity.ts.
 *
 * Without this, every product creation and every buyer registration that
 * supplies a country/currency fails on the FK the moment the schema is
 * migrated onto a clean database (CreateReferenceData1732800000001 only
 * creates the tables, it never seeds them — see that migration's own
 * comment: "no seed data... but no INSERTs run here").
 *
 * This is deliberately a minimal, uncontroversial seed set, not a full
 * ISO 3166/4217 catalog and not a real product taxonomy — just enough for
 * registration and product creation to work out of the box. Expanding the
 * country/currency/category list is a follow-up, same as the full
 * role/permission bootstrap called out in SeedBuyerRole's own comment.
 */
export class SeedReferenceData1732800000006 implements MigrationInterface {
  name = 'SeedReferenceData1732800000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // USD is the platform's base currency (H-28: exactly one is_base row,
    // enforced by the currency_one_base partial unique index).
    await queryRunner.query(`
      INSERT INTO currency (code, name, symbol, decimal_places, is_base, is_active) VALUES
        ('USD', 'US Dollar', '$', 2, true, true),
        ('INR', 'Indian Rupee', '₹', 2, false, true),
        ('EUR', 'Euro', '€', 2, false, true),
        ('GBP', 'British Pound', '£', 2, false, true),
        ('AED', 'UAE Dirham', 'د.إ', 2, false, true)
    `);

    await queryRunner.query(`
      INSERT INTO country (code, iso3, name, default_currency, is_active, is_sanctioned) VALUES
        ('US', 'USA', 'United States', 'USD', true, false),
        ('IN', 'IND', 'India', 'INR', true, false),
        ('GB', 'GBR', 'United Kingdom', 'GBP', true, false),
        ('AE', 'ARE', 'United Arab Emirates', 'AED', true, false),
        ('DE', 'DEU', 'Germany', 'EUR', true, false)
    `);

    // One root category so product.category_id has a valid FK target out
    // of the box. Real category taxonomy is a client-provided follow-up
    // (Part 1.4's own comment: "a few hundred rows"), not invented here.
    await queryRunner.query(`
      INSERT INTO category (name, slug, is_active, sort_order) VALUES
        ('General', 'general', true, 0)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM category WHERE slug = 'general'`);
    await queryRunner.query(`DELETE FROM country WHERE code IN ('US','IN','GB','AE','DE')`);
    await queryRunner.query(`DELETE FROM currency WHERE code IN ('USD','INR','EUR','GBP','AED')`);
  }
}
