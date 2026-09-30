import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * PART 3 — Vendor Catalog, from Data_Modeling_Complete.md ("Document 6 —
 * Complete Data Model", v3).
 *
 * Builds the 5 tables covering products and their approval pipeline:
 * product, product_target_country, product_price_tier, product_media,
 * product_approval_log.
 *
 * Products belong to the company (organization_id), never to the person
 * who typed them in (created_by only records who). This part carries the
 * platform's heaviest read traffic (browse and search), so its indexes
 * matter most.
 *
 * Depends on CreateExtensionsAndDomains1732800000000 (domains, pg_trgm,
 * btree_gist, set_updated_at()), CreateReferenceData1732800000001
 * (currency, country, category, hs_code — FK targets), and
 * CreateCompaniesPeopleAccess1732800000002 (organization,
 * vendor_target_country, users — FK targets).
 *
 * This is a database-only pass: no seed data (Part 4 client decision notes
 * "Sample products (dev only)" but no INSERTs run here), no application
 * code enforcing the self-approval rule (Part 3.1's "Approval can't be
 * self-approval" UPDATE statement is documented for the future service
 * layer, not executed by this migration), and no row-level security
 * policies (Part 0.11, deferred until the auth/request-context layer
 * exists, same as Part 2).
 */
export class CreateVendorCatalog1732800000003 implements MigrationInterface {
  name = 'CreateVendorCatalog1732800000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------
    // 3.1 product
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE product (
        id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        public_id              uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        organization_id        bigint NOT NULL REFERENCES organization (id),
        category_id            bigint NOT NULL REFERENCES category (id),
        hs_code                char(6) REFERENCES hs_code (code),
        name                   text NOT NULL,
        name_i18n              jsonb,
        slug                   text NOT NULL,
        description            text,
        description_i18n       jsonb,
        sku                    text,
        attributes             jsonb NOT NULL DEFAULT '{}'::jsonb,
        base_price             d_money NOT NULL,
        base_currency          d_ccy NOT NULL REFERENCES currency (code),
        moq                    d_qty NOT NULL,
        unit                   d_unit NOT NULL,
        weight_kg              numeric(12,3),
        length_cm              numeric(10,2),
        width_cm               numeric(10,2),
        height_cm              numeric(10,2),
        is_quote_only          boolean NOT NULL DEFAULT false,
        status                 text NOT NULL DEFAULT 'DRAFT',
        pending_changes        jsonb,
        pending_status         text,
        pending_submitted_by   bigint REFERENCES users (id),
        pending_submitted_at   timestamptz,
        row_version            int NOT NULL DEFAULT 1,
        created_by             bigint NOT NULL REFERENCES users (id),
        published_at           timestamptz,
        created_at             timestamptz NOT NULL DEFAULT now(),
        updated_at             timestamptz NOT NULL DEFAULT now(),
        CHECK (status IN ('DRAFT','PENDING_CHECKER','PENDING_ADMIN','APPROVED','PUBLISHED','REJECTED','DELISTED')),
        CHECK (pending_status IS NULL OR pending_status IN ('PENDING_CHECKER','PENDING_ADMIN','REJECTED')),
        CHECK ((pending_changes IS NULL) = (pending_status IS NULL)),
        -- edits-in-waiting only exist on live products
        CHECK (pending_changes IS NULL OR status IN ('PUBLISHED','APPROVED')),
        CHECK (base_price >= 0 AND moq > 0),
        -- target of children's composite FKs (H-14)
        UNIQUE (id, organization_id),
        UNIQUE (organization_id, slug)
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX product_sku_uq ON product (organization_id, sku) WHERE sku IS NOT NULL
    `);
    // Full-text search: generated tsvector column + GIN index, plus a
    // trigram index on name for typo-tolerant search (H-18). Search stays
    // inside Postgres at launch; a separate search engine is only added
    // once measured load shows the need (Part 13.5).
    await queryRunner.query(`
      ALTER TABLE product ADD COLUMN search tsvector GENERATED ALWAYS AS
        (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,''))) STORED
    `);
    await queryRunner.query(`
      CREATE INDEX product_search_gin ON product USING gin (search)
    `);
    await queryRunner.query(`
      CREATE INDEX product_name_trgm ON product USING gin (name gin_trgm_ops)
    `);
    await queryRunner.query(`
      CREATE INDEX product_listing ON product (category_id, published_at DESC) WHERE status = 'PUBLISHED'
    `);
    await queryRunner.query(`
      CREATE INDEX product_by_org ON product (organization_id, status)
    `);
    await queryRunner.query(`
      CREATE INDEX product_pending ON product (organization_id, pending_status) WHERE pending_status IS NOT NULL
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_product_updated BEFORE UPDATE ON product
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // ------------------------------------------------------------------
    // 3.2 product_target_country (H-16)
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE product_target_country (
        id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        product_id             bigint NOT NULL,
        organization_id        bigint NOT NULL,
        target_country         d_country NOT NULL,
        national_tariff_code   text,
        is_allowed             boolean NOT NULL DEFAULT true,
        block_reason           text,
        created_at             timestamptz NOT NULL DEFAULT now(),
        updated_at             timestamptz NOT NULL DEFAULT now(),
        -- a product's countries must come from its vendor's own list
        -- (Document 4 rule B.4.1), enforced by the database, not the UI
        FOREIGN KEY (product_id, organization_id) REFERENCES product (id, organization_id),
        FOREIGN KEY (organization_id, target_country) REFERENCES vendor_target_country (organization_id, target_country),
        UNIQUE (product_id, target_country),
        CHECK (is_allowed OR coalesce(btrim(block_reason), '') <> '')
      )
    `);
    // Serves the buyer's most common filter: "only show products I can
    // have delivered to my country" (Document 5 C.3 rule 4).
    await queryRunner.query(`
      CREATE INDEX ptc_buyer_filter ON product_target_country (target_country, product_id) WHERE is_allowed
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_product_target_country_updated BEFORE UPDATE ON product_target_country
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // ------------------------------------------------------------------
    // 3.3 product_price_tier (H-15)
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE product_price_tier (
        id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        product_id        bigint NOT NULL,
        organization_id   bigint NOT NULL,
        min_qty           d_qty NOT NULL,
        max_qty           d_qty,
        unit_price        d_money NOT NULL,
        created_at        timestamptz NOT NULL DEFAULT now(),
        updated_at        timestamptz NOT NULL DEFAULT now(),
        FOREIGN KEY (product_id, organization_id) REFERENCES product (id, organization_id),
        CHECK (max_qty IS NULL OR max_qty > min_qty),
        CHECK (unit_price > 0)
      )
    `);
    // Half-open range [min_qty, max_qty): a tier ends exactly where the
    // next begins, so no quantity can fall into a gap between tiers.
    // The exclusion constraint refuses overlapping tiers on the same
    // product even under concurrent edits.
    await queryRunner.query(`
      ALTER TABLE product_price_tier
        ADD COLUMN qty_range numrange GENERATED ALWAYS AS (numrange(min_qty, max_qty, '[)')) STORED
    `);
    await queryRunner.query(`
      ALTER TABLE product_price_tier
        ADD CONSTRAINT tier_no_overlap EXCLUDE USING gist (product_id WITH =, qty_range WITH &&)
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_product_price_tier_updated BEFORE UPDATE ON product_price_tier
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // ------------------------------------------------------------------
    // 3.4 product_media
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE product_media (
        id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        product_id          bigint NOT NULL,
        organization_id     bigint NOT NULL,
        media_type          text NOT NULL,
        storage_key         text NOT NULL,
        mime_type           text NOT NULL,
        size_bytes          bigint NOT NULL,
        sha256              d_sha256 NOT NULL,
        is_primary          boolean NOT NULL DEFAULT false,
        sort_order          int NOT NULL DEFAULT 0,
        moderation_status   text NOT NULL DEFAULT 'PENDING',
        created_at          timestamptz NOT NULL DEFAULT now(),
        FOREIGN KEY (product_id, organization_id) REFERENCES product (id, organization_id),
        CHECK (media_type IN ('IMAGE','VIDEO')),
        CHECK (moderation_status IN ('PENDING','APPROVED','REJECTED'))
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX media_one_primary ON product_media (product_id) WHERE is_primary
    `);
    await queryRunner.query(`
      CREATE INDEX product_media_by_product ON product_media (product_id)
    `);

    // ------------------------------------------------------------------
    // 3.5 product_approval_log (append-only)
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE product_approval_log (
        id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        product_id          bigint NOT NULL,
        organization_id     bigint NOT NULL,
        stage               text NOT NULL,
        action               text NOT NULL,
        change_type         text NOT NULL,
        changes_snapshot    jsonb NOT NULL,
        actor_user_id       bigint NOT NULL REFERENCES users (id),
        comments            text,
        created_at          timestamptz NOT NULL DEFAULT now(),
        FOREIGN KEY (product_id, organization_id) REFERENCES product (id, organization_id),
        CHECK (stage IN ('CHECKER','ADMIN')),
        CHECK (action IN ('APPROVED','REJECTED')),
        CHECK (change_type IN ('NEW_PRODUCT','EDIT')),
        CHECK (action = 'APPROVED' OR coalesce(btrim(comments), '') <> '')
      )
    `);
    await queryRunner.query(`
      CREATE INDEX pal_by_product ON product_approval_log (product_id, created_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS product_approval_log`);

    await queryRunner.query(`DROP TABLE IF EXISTS product_media`);

    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_product_price_tier_updated ON product_price_tier`);
    await queryRunner.query(`DROP TABLE IF EXISTS product_price_tier`);

    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_product_target_country_updated ON product_target_country`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS product_target_country`);

    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_product_updated ON product`);
    await queryRunner.query(`DROP TABLE IF EXISTS product`);
  }
}
