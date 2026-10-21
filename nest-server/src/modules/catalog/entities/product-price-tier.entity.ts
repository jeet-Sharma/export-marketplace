import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm';
import { ProductEntity } from './product.entity.js';

/**
 * PART 3.3 — product_price_tier (Data_Modeling_Complete.md, Document 6 v3, H-15).
 *
 * Bulk pricing: buy more, pay less per unit. min_qty/max_qty form a
 * half-open range [min_qty, max_qty) so tiers can never overlap or leave a
 * gap — enforced by a GENERATED numrange column (qty_range) plus a GiST
 * exclusion constraint (tier_no_overlap), both migration-only since
 * TypeORM decorators cannot express either.
 *
 * currency is deliberately NOT a column here: a tier is always priced in
 * the parent product's base_currency, so the two values can never
 * disagree (the schema doc calls out a real inconsistency in the design
 * docs this fixes).
 *
 * Two rules that can't be expressed as a single-row constraint (the first
 * tier's min_qty must equal product.moq; no gap between the last tier and
 * the next) are checked at the application layer when a product is
 * submitted for approval, not by this migration.
 *
 * Schema is owned by the CreateVendorCatalog migration.
 */
@Entity({ name: 'product_price_tier' })
export class ProductPriceTierEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'product_id', type: 'bigint' })
  productId!: string;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product?: Relation<ProductEntity>;

  @Column({ name: 'organization_id', type: 'bigint', comment: 'Copy of owner (composite FK, RLS)' })
  organizationId!: string;

  @Column({ name: 'min_qty', type: 'numeric', precision: 14, scale: 3, comment: 'From this quantity (included)' })
  minQty!: string;

  @Column({
    name: 'max_qty',
    type: 'numeric',
    precision: 14,
    scale: 3,
    nullable: true,
    comment: 'Up to this quantity (not included). Empty = no upper limit',
  })
  maxQty!: string | null;

  @Column({
    name: 'unit_price',
    type: 'numeric',
    precision: 19,
    scale: 4,
    comment: "Price per unit in the product's base_currency",
  })
  unitPrice!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
