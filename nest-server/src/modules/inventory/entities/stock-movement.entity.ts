import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { UserEntity } from '../../identity/entities/user.entity.js';
import { ProductEntity } from '../../catalog/entities/product.entity.js';

/**
 * PART 4.3 — stock_movement (Data_Modeling_Complete.md, Document 6 v3, H-20, append-only).
 *
 * Both available_change and reserved_change are recorded on every row
 * because shipping takes stock out of RESERVED, not out of AVAILABLE
 * (available already dropped when the stock was reserved). available_after
 * / reserved_after come from the RETURNING clause of the inventory UPDATE
 * in the same transaction, so replaying this log always rebuilds
 * `inventory` exactly, even under concurrency.
 *
 * reference_type + reference_id point at different tables (stock_reservation
 * or orders) depending on the row, so they can't carry a real foreign key —
 * the CHECK in the migration keeps the list of reference_type values closed
 * instead.
 *
 * This table grows the fastest after audit_log and is a partitioning
 * candidate (Part 13.5) once volume warrants it — not built in this pass.
 *
 * Schema is owned by the CreateInventory migration.
 */
@Entity({ name: 'stock_movement' })
@Index('IDX_movement_by_product', ['productId', 'createdAt'])
export class StockMovementEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'product_id', type: 'bigint' })
  productId!: string;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product?: Relation<ProductEntity>;

  @Column({ name: 'organization_id', type: 'bigint' })
  organizationId!: string;

  @Column({ name: 'movement_type', type: 'text' })
  movementType!: 'PURCHASE_IN' | 'RETURN_IN' | 'RESERVED' | 'RELEASED' | 'SALE_OUT' | 'ADJUSTMENT' | 'DAMAGE';

  @Column({
    name: 'available_change',
    type: 'numeric',
    precision: 14,
    scale: 3,
    comment: 'Change to quantity_available (+ in, - out)',
  })
  availableChange!: string;

  @Column({ name: 'reserved_change', type: 'numeric', precision: 14, scale: 3, comment: 'Change to quantity_reserved' })
  reservedChange!: string;

  @Column({ name: 'available_after', type: 'numeric', precision: 14, scale: 3, comment: 'quantity_available after this row' })
  availableAfter!: string;

  @Column({ name: 'reserved_after', type: 'numeric', precision: 14, scale: 3, comment: 'quantity_reserved after this row' })
  reservedAfter!: string;

  @Column({ name: 'reference_type', type: 'text' })
  referenceType!: 'RESERVATION' | 'ORDER' | 'MANUAL' | 'RETURN';

  @Column({ name: 'reference_id', type: 'bigint', comment: 'The reservation / order id' })
  referenceId!: string;

  @Column({ type: 'text', nullable: true, comment: 'Required for manual adjustments and damage' })
  notes!: string | null;

  @Column({ name: 'created_by', type: 'bigint', nullable: true, comment: 'Empty for system moves' })
  createdBy!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser?: Relation<UserEntity>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
