import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { UserEntity } from '../../identity/entities/user.entity.js';
import { ProductEntity } from './product.entity.js';

/**
 * PART 3.5 — product_approval_log (Data_Modeling_Complete.md, Document 6 v3).
 *
 * Append-only proof of who approved or rejected which VERSION of a
 * product and why. changes_snapshot keeps the approved/rejected content
 * itself, not just the fact of the decision — this is what lets
 * pending_changes on `product` stay ephemeral (M-03) without losing
 * history: once approved, the content lives here permanently.
 *
 * Schema is owned by the CreateVendorCatalog migration.
 */
@Entity({ name: 'product_approval_log' })
@Index('IDX_pal_product_created', ['productId', 'createdAt'])
export class ProductApprovalLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'product_id', type: 'bigint' })
  productId!: string;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product?: Relation<ProductEntity>;

  @Column({ name: 'organization_id', type: 'bigint' })
  organizationId!: string;

  @Column({ type: 'text', comment: "'CHECKER' (vendor side) or 'ADMIN' (platform side)" })
  stage!: 'CHECKER' | 'ADMIN';

  @Column({ type: 'text' })
  action!: 'APPROVED' | 'REJECTED';

  @Column({ name: 'change_type', type: 'text' })
  changeType!: 'NEW_PRODUCT' | 'EDIT';

  @Column({ name: 'changes_snapshot', type: 'jsonb', comment: 'Exactly what was approved or rejected' })
  changesSnapshot!: Record<string, unknown>;

  @Column({ name: 'actor_user_id', type: 'bigint' })
  actorUserId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'actor_user_id' })
  actorUser?: Relation<UserEntity>;

  @Column({ type: 'text', nullable: true, comment: 'Required when rejecting' })
  comments!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
