import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * PART 4 — Inventory, from Data_Modeling_Complete.md ("Document 6 —
 * Complete Data Model", v3).
 *
 * Builds the 4 tables covering stock state and its audit trail:
 * inventory, stock_reservation, stock_movement, stock_alert.
 *
 * `inventory` is the one table where two buyers can race for the same
 * row. It follows the current-state + event-log pattern: `inventory`
 * holds only "how much is there right now" for instant lookup and row
 * locking, while `stock_movement` holds "how we got here" for audit.
 * `stock_reservation` (M-04) records each hold taken when a checkout
 * starts paying, so quantity_reserved is always provably the sum of HELD +
 * CONVERTED rows instead of a bare number nobody can trace back.
 *
 * Depends on CreateExtensionsAndDomains1732800000000 (domains,
 * set_updated_at()) and CreateVendorCatalog1732800000003 (product — FK
 * target for the composite FKs below). checkout_session_id and order_id on
 * stock_reservation are left as plain bigint with no FK yet — the
 * checkout_session and orders tables belong to Part 7 (Cart, Checkout &
 * Orders), not built in this pass; the FK is added in that migration once
 * the target tables exist.
 *
 * This is a database-only pass: no application code runs the atomic
 * reserve/release statements documented in Part 4.1/4.2, no reservation
 * sweeper job, and no row-level security policies (Part 0.11, deferred
 * until the auth/request-context layer exists, same as Parts 2 and 3).
 */
export class CreateInventory1732800000004 implements MigrationInterface {
  name = 'CreateInventory1732800000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------------------------------------------------------------------
    // 4.1 inventory (M-04, H-14)
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE inventory (
        id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        product_id             bigint NOT NULL UNIQUE,
        organization_id        bigint NOT NULL,
        quantity_available     d_qty NOT NULL DEFAULT 0,
        quantity_reserved      d_qty NOT NULL DEFAULT 0,
        low_stock_threshold    d_qty NOT NULL DEFAULT 0,
        unit                   d_unit NOT NULL,
        updated_at             timestamptz NOT NULL DEFAULT now(),
        FOREIGN KEY (product_id, organization_id) REFERENCES product (id, organization_id),
        -- the last line of defence against overselling
        CHECK (quantity_available >= 0 AND quantity_reserved >= 0)
      )
    `);
    // UNIQUE(product_id) above means one warehouse per product. If the
    // client adds multiple warehouses, this becomes UNIQUE(product_id,
    // warehouse_id) with a warehouse table — nothing else changes.
    await queryRunner.query(`
      CREATE INDEX inventory_by_org ON inventory (organization_id)
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_inventory_updated BEFORE UPDATE ON inventory
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // ------------------------------------------------------------------
    // 4.2 stock_reservation (M-04)
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE stock_reservation (
        id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        product_id            bigint NOT NULL,
        organization_id       bigint NOT NULL,
        -- checkout_session and orders belong to Part 7, not built yet —
        -- FK added there once those tables exist.
        checkout_session_id   bigint,
        order_id              bigint,
        quantity               d_qty NOT NULL,
        status                text NOT NULL DEFAULT 'HELD',
        expires_at            timestamptz,
        created_at            timestamptz NOT NULL DEFAULT now(),
        resolved_at           timestamptz,
        FOREIGN KEY (product_id, organization_id) REFERENCES product (id, organization_id),
        CHECK (status IN ('HELD','CONVERTED','CONSUMED','RELEASED','EXPIRED')),
        CHECK (num_nonnulls(checkout_session_id, order_id) >= 1),
        CHECK (quantity > 0)
      )
    `);
    // At most one live hold per checkout line — a second attempt to
    // reserve the same product in the same checkout must fail loudly, not
    // silently double-hold stock.
    await queryRunner.query(`
      CREATE UNIQUE INDEX reservation_one_per_line ON stock_reservation (checkout_session_id, product_id)
        WHERE status = 'HELD'
    `);
    // Feeds the every-minute sweeper that expires stale holds.
    await queryRunner.query(`
      CREATE INDEX reservation_sweeper ON stock_reservation (expires_at) WHERE status = 'HELD'
    `);
    await queryRunner.query(`
      CREATE INDEX stock_reservation_by_org ON stock_reservation (organization_id)
    `);

    // ------------------------------------------------------------------
    // 4.3 stock_movement (append-only, H-20)
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE stock_movement (
        id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        product_id         bigint NOT NULL,
        organization_id    bigint NOT NULL,
        movement_type      text NOT NULL,
        available_change   d_signed_qty NOT NULL,
        reserved_change    d_signed_qty NOT NULL,
        available_after    d_qty NOT NULL,
        reserved_after     d_qty NOT NULL,
        reference_type     text NOT NULL,
        reference_id       bigint NOT NULL,
        notes              text,
        created_by         bigint REFERENCES users (id),
        created_at         timestamptz NOT NULL DEFAULT now(),
        FOREIGN KEY (product_id, organization_id) REFERENCES product (id, organization_id),
        CHECK (movement_type IN ('PURCHASE_IN','RETURN_IN','RESERVED','RELEASED','SALE_OUT','ADJUSTMENT','DAMAGE')),
        CHECK (reference_type IN ('RESERVATION','ORDER','MANUAL','RETURN')),
        CHECK (movement_type NOT IN ('ADJUSTMENT','DAMAGE') OR coalesce(btrim(notes), '') <> ''),
        CHECK (available_change <> 0 OR reserved_change <> 0)
      )
    `);
    await queryRunner.query(`
      CREATE INDEX movement_by_product ON stock_movement (product_id, created_at DESC)
    `);

    // ------------------------------------------------------------------
    // 4.4 stock_alert (H-21)
    // ------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE stock_alert (
        id                 bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        product_id         bigint NOT NULL,
        organization_id    bigint NOT NULL,
        alert_type         text NOT NULL,
        current_quantity   d_qty NOT NULL,
        threshold          d_qty NOT NULL,
        status             text NOT NULL DEFAULT 'OPEN',
        notified_at        timestamptz,
        resolved_at        timestamptz,
        created_at         timestamptz NOT NULL DEFAULT now(),
        FOREIGN KEY (product_id, organization_id) REFERENCES product (id, organization_id),
        CHECK (alert_type IN ('LOW_STOCK','OUT_OF_STOCK')),
        CHECK (status IN ('OPEN','NOTIFIED','RESOLVED'))
      )
    `);
    // The daily scan can run any number of times without opening a second
    // alert for the same product while one is already open/notified.
    await queryRunner.query(`
      CREATE UNIQUE INDEX one_open_alert ON stock_alert (product_id) WHERE status IN ('OPEN','NOTIFIED')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS stock_alert`);
    await queryRunner.query(`DROP TABLE IF EXISTS stock_movement`);
    await queryRunner.query(`DROP TABLE IF EXISTS stock_reservation`);

    await queryRunner.query(`DROP TRIGGER IF EXISTS trg_inventory_updated ON inventory`);
    await queryRunner.query(`DROP TABLE IF EXISTS inventory`);
  }
}
