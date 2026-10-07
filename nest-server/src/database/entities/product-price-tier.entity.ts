import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity.js';

// Optional quantity-based bulk pricing with per-tier shipping, duties and
// tax estimates. All monetary columns are `numeric` strings — never cast
// to `number` in application code (see marketplace-domain.md).
@Entity('product_price_tiers')
@Index(['productId', 'minQuantity'])
@Check('CHK_product_price_tiers_min_quantity_positive', `"min_quantity" > 0`)
@Check('CHK_product_price_tiers_price_non_negative', `"price" >= 0`)
@Check(
  'CHK_product_price_tiers_shipping_non_negative',
  `"shipping_estimate" IS NULL OR "shipping_estimate" >= 0`,
)
@Check(
  'CHK_product_price_tiers_duties_non_negative',
  `"duties_estimate" IS NULL OR "duties_estimate" >= 0`,
)
@Check(
  'CHK_product_price_tiers_taxes_non_negative',
  `"taxes_estimate" IS NULL OR "taxes_estimate" >= 0`,
)
export class ProductPriceTier {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @Column({ type: 'numeric', precision: 18, scale: 4, name: 'min_quantity' })
  minQuantity!: string;

  // Null means no upper bound (open-ended highest tier).
  @Column({ type: 'numeric', precision: 18, scale: 4, name: 'max_quantity', nullable: true })
  maxQuantity!: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 4 })
  price!: string;

  @Column({ type: 'numeric', precision: 18, scale: 4, name: 'shipping_estimate', nullable: true })
  shippingEstimate!: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 4, name: 'duties_estimate', nullable: true })
  dutiesEstimate!: string | null;

  @Column({ type: 'numeric', precision: 18, scale: 4, name: 'taxes_estimate', nullable: true })
  taxesEstimate!: string | null;

  // Currency used by price and cost estimates, e.g. USD.
  @Column({ type: 'char', length: 3, name: 'currency_code' })
  currencyCode!: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
