import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { ProductEntity } from '../../catalog/entities/product.entity.js';

/**
 * PART 4.4 — stock_alert (Data_Modeling_Complete.md, Document 6 v3, H-21).
 *
 * The daily scan can run any number of times without opening a second
 * alert for the same product while one is already OPEN or NOTIFIED — the
 * partial unique index one_open_alert (migration-only) refuses it. The
 * notification itself goes through the `notification` table (Part 10, not
 * built yet), which has its own duplicate protection.
 *
 * Schema is owned by the CreateInventory migration.
 */
@Entity({ name: 'stock_alert' })
export class StockAlertEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'product_id', type: 'bigint' })
  productId!: string;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product?: Relation<ProductEntity>;

  @Column({ name: 'organization_id', type: 'bigint' })
  organizationId!: string;

  @Column({ name: 'alert_type', type: 'text' })
  alertType!: 'LOW_STOCK' | 'OUT_OF_STOCK';

  @Column({ name: 'current_quantity', type: 'numeric', precision: 14, scale: 3, comment: 'At the time of the alert' })
  currentQuantity!: string;

  @Column({ type: 'numeric', precision: 14, scale: 3, comment: 'The limit crossed' })
  threshold!: string;

  @Column({ type: 'text', default: 'OPEN' })
  status!: 'OPEN' | 'NOTIFIED' | 'RESOLVED';

  @Column({ name: 'notified_at', type: 'timestamptz', nullable: true })
  notifiedAt!: Date | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
