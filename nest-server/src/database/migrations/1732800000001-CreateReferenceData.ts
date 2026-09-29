import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * PART 1 — Reference Data, from Data_Modeling_Complete.md ("Document 6 —
 * Complete Data Model", v3).
 *
 * Small tables that change rarely and are read constantly: currency,
 * country, exchange_rate, category, hs_code. All are meant to be cached in
 * the application and refreshed only when an admin edits them (Part 13.4)
 * — no such caching exists yet in this database-only pass.
 *
 * Depends on CreateExtensionsAndDomains1732800000000 for the d_ccy/d_country
 * domains and the pgcrypto/btree_gist/pg_trgm extensions.
 */
export class CreateReferenceData1732800000001 implements MigrationInterface {
  name = 'CreateReferenceData1732800000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------
    // 1.1 currency
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE currency (
        code            d_ccy PRIMARY KEY,
        name            text NOT NULL,
        symbol          text NOT NULL,
        decimal_places  smallint NOT NULL DEFAULT 2,
        is_base         boolean NOT NULL DEFAULT false,
        is_active       boolean NOT NULL DEFAULT true,
        CHECK (decimal_places BETWEEN 0 AND 4)
      )
    `);
    // Exactly one base currency can ever exist — every report that converts
    // to base must have a single, unambiguous base to convert to (H-28).
    await queryRunner.query(`
      CREATE UNIQUE INDEX currency_one_base ON currency ((true)) WHERE is_base
    `);

    // ------------------------------------------------------------------
    // 1.2 country (G-01)
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE country (
        code               d_country PRIMARY KEY,
        iso3               char(3) NOT NULL UNIQUE,
        name               text NOT NULL,
        default_currency   d_ccy REFERENCES currency (code),
        is_active          boolean NOT NULL DEFAULT true,
        is_sanctioned      boolean NOT NULL DEFAULT false,
        created_at         timestamptz NOT NULL DEFAULT now(),
        updated_at         timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX country_default_currency_idx ON country (default_currency)
    `);

    // ------------------------------------------------------------------
    // 1.3 exchange_rate (append-only)
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE exchange_rate (
        id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        from_currency   d_ccy NOT NULL REFERENCES currency (code),
        to_currency     d_ccy NOT NULL REFERENCES currency (code),
        rate            d_rate NOT NULL,
        markup_percent  d_percent,
        effective_rate  d_rate NOT NULL,
        source          text NOT NULL,
        fetched_at      timestamptz NOT NULL DEFAULT now(),
        valid_until     timestamptz NOT NULL,
        CHECK (from_currency <> to_currency)
      )
    `);
    // Rates are never updated, only added (H-28). Every checkout/order locks
    // the exchange_rate_id it used, so any invoice can be traced back to the
    // exact rate row. "Latest rate for USD->INR" is one index lookup.
    await queryRunner.query(`
      CREATE INDEX exchange_rate_latest ON exchange_rate (from_currency, to_currency, fetched_at DESC)
    `);

    // ------------------------------------------------------------------
    // 1.4 category
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE category (
        id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        parent_id   bigint REFERENCES category (id),
        name        text NOT NULL,
        slug        text NOT NULL UNIQUE,
        is_active   boolean NOT NULL DEFAULT true,
        sort_order  int NOT NULL DEFAULT 0,
        created_at  timestamptz NOT NULL DEFAULT now(),
        updated_at  timestamptz NOT NULL DEFAULT now(),
        CHECK (parent_id <> id)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX category_parent_idx ON category (parent_id)
    `);

    // ------------------------------------------------------------------
    // 1.5 hs_code
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE hs_code (
        code         char(6) PRIMARY KEY,
        hs_version   text NOT NULL,
        description  text NOT NULL,
        chapter      char(2) NOT NULL,
        is_active    boolean NOT NULL DEFAULT true,
        CHECK (code ~ '^[0-9]{6}$')
      )
    `);
    await queryRunner.query(`
      CREATE INDEX hs_code_chapter_idx ON hs_code (chapter)
    `);

    // updated_at trigger (Part 0.6), attached to every table here that has
    // updated_at. Created once and reused by every future migration/table.
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_country_updated BEFORE UPDATE ON country
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_category_updated BEFORE UPDATE ON category
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_category_updated ON category`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_country_updated ON country`);
    // set_updated_at() is left in place — later migrations' tables also use
    // it; it is only dropped by the migration that originally owns cleanup
    // of shared functions, if ever needed.
    await queryRunner.query(`DROP TABLE IF EXISTS hs_code`);
    await queryRunner.query(`DROP TABLE IF EXISTS category`);
    await queryRunner.query(`DROP TABLE IF EXISTS exchange_rate`);
    await queryRunner.query(`DROP TABLE IF EXISTS country`);
    await queryRunner.query(`DROP TABLE IF EXISTS currency`);
  }
}
