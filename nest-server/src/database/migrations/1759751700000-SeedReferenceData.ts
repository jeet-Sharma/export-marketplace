import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds minimum reference data so POST /admin/products (and anything else
 * referencing countries/categories/vendors) has real rows to point at.
 *
 * Before this migration, `countries`, `categories`, and `vendors` were
 * created empty by InitPhase1Schema — nothing seeded them, so every
 * products.category_id / products.vendor_id / products.source_country_id /
 * product_countries.country_id foreign key was unsatisfiable by
 * definition, regardless of which UUIDs a client sent.
 *
 * This is a one-time dev/initial-environment seed, not a repeatable
 * reference-data load — same convention as SeedAdminRoleAndUser. It's
 * idempotent (ON CONFLICT DO NOTHING against each table's unique
 * constraint) so re-running migrations never duplicates rows or fails.
 *
 * The country list and vendor are intentionally minimal — enough to
 * exercise the product creation flow end-to-end. Expand as real reference
 * data becomes available; this is not meant to be the final/complete set.
 */
export class SeedReferenceData1759751700000 implements MigrationInterface {
  name = 'SeedReferenceData1759751700000';

  private readonly countries: Array<{
    iso2: string;
    iso3: string;
    name: string;
  }> = [
    { iso2: 'US', iso3: 'USA', name: 'United States' },
    { iso2: 'IN', iso3: 'IND', name: 'India' },
    { iso2: 'GB', iso3: 'GBR', name: 'United Kingdom' },
    { iso2: 'AE', iso3: 'ARE', name: 'United Arab Emirates' },
    { iso2: 'DE', iso3: 'DEU', name: 'Germany' },
    { iso2: 'SG', iso3: 'SGP', name: 'Singapore' },
  ];

  private readonly categories: Array<{ name: string; slug: string }> = [
    { name: 'Spices & Seasonings', slug: 'spices-seasonings' },
    { name: 'Textiles & Apparel', slug: 'textiles-apparel' },
    { name: 'Agricultural Products', slug: 'agricultural-products' },
    { name: 'Industrial Equipment', slug: 'industrial-equipment' },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const country of this.countries) {
      await queryRunner.query(
        `
        INSERT INTO "countries" ("iso2_code", "iso3_code", "name", "is_active")
        VALUES ($1, $2, $3, true)
        ON CONFLICT ("iso2_code") DO NOTHING
      `,
        [country.iso2, country.iso3, country.name],
      );
    }

    for (const [index, category] of this.categories.entries()) {
      await queryRunner.query(
        `
        INSERT INTO "categories" ("name", "slug", "is_active", "sort_order")
        VALUES ($1, $2, true, $3)
        ON CONFLICT ("slug") DO NOTHING
      `,
        [category.name, category.slug, index],
      );
    }

    // One seed vendor, linked to the seeded "India" country, so
    // CreateProductDto.vendorId has a real row to reference out of the box.
    await queryRunner.query(`
      INSERT INTO "vendors" ("company_name", "display_name", "email", "status", "country_id")
      SELECT 'Export Marketplace Demo Vendor', 'Demo Vendor', 'vendor-demo@export-marketplace.local', 'ACTIVE', c."id"
      FROM "countries" c
      WHERE c."iso2_code" = 'IN'
      AND NOT EXISTS (
        SELECT 1 FROM "vendors" WHERE "company_name" = 'Export Marketplace Demo Vendor'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "vendors" WHERE "company_name" = 'Export Marketplace Demo Vendor'`,
    );
    await queryRunner.query(
      `DELETE FROM "categories" WHERE "slug" IN (${this.categories.map((_, i) => `$${i + 1}`).join(', ')})`,
      this.categories.map((c) => c.slug),
    );
    await queryRunner.query(
      `DELETE FROM "countries" WHERE "iso2_code" IN (${this.countries.map((_, i) => `$${i + 1}`).join(', ')})`,
      this.countries.map((c) => c.iso2),
    );
  }
}
