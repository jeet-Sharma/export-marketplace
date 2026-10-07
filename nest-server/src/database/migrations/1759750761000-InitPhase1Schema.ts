import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Phase 1 Data Model v0.1 — initial schema.
 *
 * Creates the 12 tables described in Phase-1-Data-Model-v0.1.docx, in
 * dependency order: countries -> vendors -> users -> roles -> permissions
 * -> user_roles -> role_permissions -> categories -> products ->
 * product_images -> product_price_tiers -> product_countries.
 *
 * Fields marked TBD in the source document (products.description,
 * category_id, price, currency_code, unit, moq, hs_code,
 * source_country_id, export_eligibility; vendors.country_id) are made
 * nullable here rather than guessing a business rule — the document is
 * explicit that the DB should enforce basic validity (status values,
 * non-negative money) while the service layer enforces stricter
 * publish-time requirements once those decisions are finalized.
 *
 * No ON DELETE CASCADE is used anywhere: the source document (section 8)
 * treats permanent deletion as an open decision and says child tables may
 * cascade "only if permanent product deletion is formally approved". Until
 * that's confirmed, all foreign keys default to RESTRICT so a delete fails
 * loudly instead of silently cascading.
 */
export class InitPhase1Schema1759750761000 implements MigrationInterface {
  name = 'InitPhase1Schema1759750761000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // 1. countries ---------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "countries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "iso2_code" char(2) NOT NULL,
        "iso3_code" char(3),
        "name" varchar(150) NOT NULL,
        "is_active" boolean NOT NULL,
        CONSTRAINT "PK_countries" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_countries_iso2_code" UNIQUE ("iso2_code"),
        CONSTRAINT "UQ_countries_iso3_code" UNIQUE ("iso3_code"),
        CONSTRAINT "UQ_countries_name" UNIQUE ("name")
      )
    `);

    // 2. vendors -------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "vendors" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "company_name" varchar(250) NOT NULL,
        "display_name" varchar(200),
        "email" varchar(320),
        "phone" varchar(50),
        "country_id" uuid,
        "status" varchar(30) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_vendors" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vendors_country_id" FOREIGN KEY ("country_id")
          REFERENCES "countries" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vendors_status_company_name" ON "vendors" ("status", "company_name")
    `);

    // 3. users ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" varchar(320) NOT NULL,
        "password_hash" text NOT NULL,
        "first_name" varchar(100) NOT NULL,
        "last_name" varchar(100) NOT NULL,
        "status" varchar(30) NOT NULL,
        "last_login_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "vendor_id" uuid,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_vendor_id" FOREIGN KEY ("vendor_id")
          REFERENCES "vendors" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
      )
    `);
    // Normalized-email uniqueness, per section 7, rather than a plain
    // UNIQUE(email) constraint, so case-variant emails can't duplicate.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_users_lower_email" ON "users" (lower("email"))
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_users_vendor_id" ON "users" ("vendor_id") WHERE "vendor_id" IS NOT NULL
    `);

    // 4. roles ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" varchar(100) NOT NULL,
        "name" varchar(150) NOT NULL,
        "description" text,
        "is_system" boolean NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_roles_code" UNIQUE ("code")
      )
    `);

    // 5. permissions -----------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" varchar(120) NOT NULL,
        "name" varchar(150) NOT NULL,
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permissions_code" UNIQUE ("code")
      )
    `);

    // 6. user_roles ------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "user_roles" (
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        "assigned_at" timestamptz NOT NULL DEFAULT now(),
        "assigned_by" uuid,
        CONSTRAINT "PK_user_roles" PRIMARY KEY ("user_id", "role_id"),
        CONSTRAINT "UQ_user_roles_user_id_role_id" UNIQUE ("user_id", "role_id"),
        CONSTRAINT "FK_user_roles_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT "FK_user_roles_role_id" FOREIGN KEY ("role_id")
          REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT "FK_user_roles_assigned_by" FOREIGN KEY ("assigned_by")
          REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
      )
    `);

    // 7. role_permissions --------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_role_permissions" PRIMARY KEY ("role_id", "permission_id"),
        CONSTRAINT "UQ_role_permissions_role_id_permission_id" UNIQUE ("role_id", "permission_id"),
        CONSTRAINT "FK_role_permissions_role_id" FOREIGN KEY ("role_id")
          REFERENCES "roles" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT "FK_role_permissions_permission_id" FOREIGN KEY ("permission_id")
          REFERENCES "permissions" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
      )
    `);

    // 8. categories --------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(150) NOT NULL,
        "slug" varchar(180) NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL,
        "sort_order" integer,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug")
      )
    `);

    // 9. products ------------------------------------------------------------
    // description, category_id, price, currency_code, unit, moq, hs_code,
    // source_country_id, export_eligibility are TBD in the source doc ->
    // nullable here.
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" varchar(220) NOT NULL,
        "name" varchar(250) NOT NULL,
        "description" text,
        "category_id" uuid,
        "vendor_id" uuid NOT NULL,
        "status" varchar(20) NOT NULL,
        "price" numeric(18,4),
        "currency_code" char(3),
        "unit" varchar(50),
        "moq" numeric(18,4),
        "hs_code" varchar(20),
        "source_country_id" uuid,
        "export_eligibility" varchar(50),
        "country_restrictions" text,
        "estimated_delivery_text" varchar(150),
        "duties_taxes_note" text,
        "created_by" uuid NOT NULL,
        "updated_by" uuid NOT NULL,
        "published_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_products_slug" UNIQUE ("slug"),
        CONSTRAINT "CHK_products_status" CHECK ("status" IN ('DRAFT', 'PUBLISHED')),
        CONSTRAINT "CHK_products_price_non_negative" CHECK ("price" IS NULL OR "price" >= 0),
        CONSTRAINT "CHK_products_moq_positive" CHECK ("moq" IS NULL OR "moq" > 0),
        CONSTRAINT "FK_products_category_id" FOREIGN KEY ("category_id")
          REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT "FK_products_vendor_id" FOREIGN KEY ("vendor_id")
          REFERENCES "vendors" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT "FK_products_source_country_id" FOREIGN KEY ("source_country_id")
          REFERENCES "countries" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT "FK_products_created_by" FOREIGN KEY ("created_by")
          REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT "FK_products_updated_by" FOREIGN KEY ("updated_by")
          REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_products_status_created_at" ON "products" ("status", "created_at")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_products_category_id_status" ON "products" ("category_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_products_source_country_id_status" ON "products" ("source_country_id", "status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_products_vendor_id_status" ON "products" ("vendor_id", "status")
    `);

    // 10. product_images ------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "product_images" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "product_id" uuid NOT NULL,
        "s3_object_key" text NOT NULL,
        "alt_text" varchar(250),
        "is_primary" boolean NOT NULL,
        "sort_order" integer NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_images" PRIMARY KEY ("id"),
        CONSTRAINT "FK_product_images_product_id" FOREIGN KEY ("product_id")
          REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_product_images_product_id_sort_order" ON "product_images" ("product_id", "sort_order")
    `);

    // 11. product_price_tiers -------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "product_price_tiers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "product_id" uuid NOT NULL,
        "min_quantity" numeric(18,4) NOT NULL,
        "max_quantity" numeric(18,4),
        "price" numeric(18,4) NOT NULL,
        "shipping_estimate" numeric(18,4),
        "duties_estimate" numeric(18,4),
        "taxes_estimate" numeric(18,4),
        "currency_code" char(3) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_price_tiers" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_product_price_tiers_min_quantity_positive" CHECK ("min_quantity" > 0),
        CONSTRAINT "CHK_product_price_tiers_price_non_negative" CHECK ("price" >= 0),
        CONSTRAINT "CHK_product_price_tiers_shipping_non_negative" CHECK ("shipping_estimate" IS NULL OR "shipping_estimate" >= 0),
        CONSTRAINT "CHK_product_price_tiers_duties_non_negative" CHECK ("duties_estimate" IS NULL OR "duties_estimate" >= 0),
        CONSTRAINT "CHK_product_price_tiers_taxes_non_negative" CHECK ("taxes_estimate" IS NULL OR "taxes_estimate" >= 0),
        CONSTRAINT "FK_product_price_tiers_product_id" FOREIGN KEY ("product_id")
          REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_product_price_tiers_product_id_min_quantity" ON "product_price_tiers" ("product_id", "min_quantity")
    `);

    // 12. product_countries --------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "product_countries" (
        "product_id" uuid NOT NULL,
        "country_id" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_product_countries" PRIMARY KEY ("product_id", "country_id"),
        CONSTRAINT "UQ_product_countries_product_id_country_id" UNIQUE ("product_id", "country_id"),
        CONSTRAINT "FK_product_countries_product_id" FOREIGN KEY ("product_id")
          REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT,
        CONSTRAINT "FK_product_countries_country_id" FOREIGN KEY ("country_id")
          REFERENCES "countries" ("id") ON DELETE RESTRICT ON UPDATE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_product_countries_country_id_product_id" ON "product_countries" ("country_id", "product_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in strict reverse dependency order.
    await queryRunner.query(`DROP TABLE "product_countries"`);
    await queryRunner.query(`DROP TABLE "product_price_tiers"`);
    await queryRunner.query(`DROP TABLE "product_images"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "vendors"`);
    await queryRunner.query(`DROP TABLE "countries"`);
  }
}
