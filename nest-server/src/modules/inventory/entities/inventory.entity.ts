import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm';
import { ProductEntity } from '../../catalog/entities/product.entity.js';

/**
 * PART 4.1 — inventory (Data_Modeling_Complete.md, Document 6 v3, M-04, H-14).
 *
 * The one table where two buyers can race for the same row. Follows the
 * current-state + event-log pattern: this table holds only "how much is
 * there right now" for instant lookup and row locking; stock_movement
 * holds "how we got here" for audit.
 *
 * UNIQUE(product_id) (migration) means one warehouse per product today.
 * If the client adds multiple warehouses this becomes
 * UNIQUE(product_id, warehouse_id) with a warehouse table — nothing else
 * changes.
 *
 * Reserving/releasing stock is a single atomic UPDATE ... RETURNING
 * statement (documented in the schema doc) run by the application layer,
 * not expressed here — this entity only maps the current-state columns.
 *
 * Schema is owned by the CreateInventory migration.
 */
@Entity({ name: 'inventory' })
export class InventoryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'product_id', type: 'bigint', unique: true, comment: 'One row per product (single warehouse)' })
  productId!: string;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product?: Relation<ProductEntity>;

  @Column({ name: 'organization_id', type: 'bigint' })
  organizationId!: string;

  @Column({
    name: 'quantity_available',
    type: 'numeric',
    precision: 14,
    scale: 3,
    default: 0,
    comment: 'Free to sell right now',
  })
  quantityAvailable!: string;

  @Column({
    name: 'quantity_reserved',
    type: 'numeric',
    precision: 14,
    scale: 3,
    default: 0,
    comment: 'Held for checkouts and unshipped orders',
  })
  quantityReserved!: string;

  @Column({ name: 'low_stock_threshold', type: 'numeric', precision: 14, scale: 3, default: 0, comment: 'Alert below this' })
  lowStockThreshold!: string;

  @Column({ type: 'text', comment: "Same as the product's unit" })
  unit!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
