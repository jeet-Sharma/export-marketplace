import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { ProductEntity } from '../../catalog/entities/product.entity.js';

/**
 * PART 4.2 — stock_reservation (Data_Modeling_Complete.md, Document 6 v3, M-04).
 *
 * Records each hold taken when a checkout starts paying — BEFORE money is
 * captured, not after (the v2 bug this fixes: two buyers could both pay
 * for the last 200kg and one had to be refunded). quantity_reserved on
 * `inventory` always equals the sum of HELD + CONVERTED rows here, so a
 * nightly reconciliation job can prove it instead of trusting a bare
 * number nobody can trace.
 *
 * checkout_session_id and order_id are plain bigint with NO foreign key
 * yet: checkout_session and orders belong to Part 7 (Cart, Checkout &
 * Orders), not built in this pass. The FK is added once those tables
 * exist (see CreateInventory migration header).
 *
 * Lifecycle: HELD -> CONVERTED (order_id set) -> CONSUMED (order shipped)
 *            HELD/CONVERTED -> RELEASED (payment failed/cancelled/rejected)
 *            HELD -> EXPIRED (sweeper, every minute, expires_at passed)
 * Every transition adjusts `inventory` and writes a `stock_movement` row
 * in the same transaction — application-layer concern, not built here.
 *
 * Schema is owned by the CreateInventory migration.
 */
@Entity({ name: 'stock_reservation' })
@Index('IDX_reservation_sweeper', ['expiresAt'])
export class StockReservationEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'product_id', type: 'bigint' })
  productId!: string;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product?: Relation<ProductEntity>;

  @Column({ name: 'organization_id', type: 'bigint' })
  organizationId!: string;

  @Column({
    name: 'checkout_session_id',
    type: 'bigint',
    nullable: true,
    comment: 'The checkout that took the hold — FK deferred to Part 7',
  })
  checkoutSessionId!: string | null;

  @Column({
    name: 'order_id',
    type: 'bigint',
    nullable: true,
    comment: 'Filled when the checkout becomes an order — FK deferred to Part 7',
  })
  orderId!: string | null;

  @Column({ type: 'numeric', precision: 14, scale: 3 })
  quantity!: string;

  @Column({ type: 'text', default: 'HELD' })
  status!: 'HELD' | 'CONVERTED' | 'CONSUMED' | 'RELEASED' | 'EXPIRED';

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true, comment: "= the checkout's expiry while HELD" })
  expiresAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true, comment: 'When it left HELD / CONVERTED' })
  resolvedAt!: Date | null;
}
