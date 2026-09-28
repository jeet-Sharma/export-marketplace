import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * PART 0.3 — Shared types (domains) from Data_Modeling_Complete.md ("Document 6
 * — Complete Data Model", v3).
 *
 * These PostgreSQL extensions and domains are used by every later part of
 * the schema (reference data, registration, catalog, orders, etc.), so they
 * are created once here rather than repeated per migration. A "domain" is a
 * named type with its own CHECK built in — created once, reused as a column
 * type everywhere, so no table can forget the rule (e.g. a money column can
 * never silently become a plain float).
 */
export class CreateExtensionsAndDomains1732800000000 implements MigrationInterface {
  name = 'CreateExtensionsAndDomains1732800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`); // gen_random_uuid(), encryption helpers
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS btree_gist`); // exclusion constraints (price tiers, commission periods)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`); // fuzzy product search

    // money; sign allowed (adjustments/refunds can be negative)
    await queryRunner.query(`CREATE DOMAIN d_money AS numeric(19,4)`);
    // quantities: goods sell by weight, e.g. 2.5 TON or 0.75 KG
    await queryRunner.query(`CREATE DOMAIN d_qty AS numeric(14,3) CHECK (VALUE >= 0)`);
    // stock movements: positive = in, negative = out
    await queryRunner.query(`CREATE DOMAIN d_signed_qty AS numeric(14,3)`);
    // exchange rates: e.g. 0.01201234
    await queryRunner.query(`CREATE DOMAIN d_rate AS numeric(18,8) CHECK (VALUE > 0)`);
    await queryRunner.query(
      `CREATE DOMAIN d_percent AS numeric(6,3) CHECK (VALUE >= 0 AND VALUE <= 100)`,
    );
    // ISO 4217 currency code: USD, INR
    await queryRunner.query(`CREATE DOMAIN d_ccy AS char(3) CHECK (VALUE ~ '^[A-Z]{3}$')`);
    // ISO 3166-1 alpha-2 country code: US, IN
    await queryRunner.query(`CREATE DOMAIN d_country AS char(2) CHECK (VALUE ~ '^[A-Z]{2}$')`);
    await queryRunner.query(
      `CREATE DOMAIN d_unit AS text CHECK (VALUE IN ('KG','TON','PIECE','BOX','CARTON','LITRE','METRE'))`,
    );
    await queryRunner.query(
      `CREATE DOMAIN d_incoterm AS text CHECK (VALUE IN ('EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP'))`,
    );
    await queryRunner.query(`CREATE DOMAIN d_sha256 AS char(64) CHECK (VALUE ~ '^[0-9a-f]{64}$')`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP DOMAIN IF EXISTS d_sha256`);
    await queryRunner.query(`DROP DOMAIN IF EXISTS d_incoterm`);
    await queryRunner.query(`DROP DOMAIN IF EXISTS d_unit`);
    await queryRunner.query(`DROP DOMAIN IF EXISTS d_country`);
    await queryRunner.query(`DROP DOMAIN IF EXISTS d_ccy`);
    await queryRunner.query(`DROP DOMAIN IF EXISTS d_percent`);
    await queryRunner.query(`DROP DOMAIN IF EXISTS d_rate`);
    await queryRunner.query(`DROP DOMAIN IF EXISTS d_signed_qty`);
    await queryRunner.query(`DROP DOMAIN IF EXISTS d_qty`);
    await queryRunner.query(`DROP DOMAIN IF EXISTS d_money`);
    // Extensions are left in place on rollback — other databases/schemas in
    // the same cluster may depend on them, and dropping is not required to
    // undo this migration's own effect.
  }
}