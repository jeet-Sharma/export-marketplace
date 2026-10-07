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
import { Category } from './category.entity.js';
import { Country } from './country.entity.js';
import { User } from './user.entity.js';
import { Vendor } from './vendor.entity.js';

// Core Phase 1 product catalogue entity. status is limited to DRAFT and
// PUBLISHED (enforced at the DB via CHECK, see the migration). Public
// catalogue queries must filter to PUBLISHED — enforce that in the
// service/query layer (see marketplace-domain.md), not here.
//
// description, category, price, currencyCode, unit, moq, hsCode,
// sourceCountry and exportEligibility are TBD in the source document and
// are therefore nullable — do not treat their presence as a publish
// requirement until that's confirmed by Product Management.
//
// Money fields (price) are mapped as `numeric` with `transformer`-free
// string handling (TypeORM returns `numeric` as a string by default) to
// avoid floating-point precision loss — never cast these to `number` in
// application code; see marketplace-domain.md's money-handling rule.
@Entity('products')
@Index(['status', 'createdAt'])
@Index(['categoryId', 'status'])
@Index(['sourceCountryId', 'status'])
@Index(['vendorId', 'status'])
@Check('CHK_products_status', `"status" IN ('DRAFT', 'PUBLISHED')`)
@Check('CHK_products_price_non_negative', `"price" IS NULL OR "price" >= 0`)
@Check('CHK_products_moq_positive', `"moq" IS NULL OR "moq" > 0`)
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Public URL identifier.
  @Column({ type: 'varchar', length: 220, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 250 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ManyToOne(() => Category, { nullable: true, onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category!: Category | null;

  @Column({ type: 'uuid', name: 'category_id', nullable: true })
  categoryId!: string | null;

  @ManyToOne(() => Vendor, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'vendor_id' })
  vendor!: Vendor;

  @Column({ type: 'uuid', name: 'vendor_id' })
  vendorId!: string;

  // DRAFT or PUBLISHED.
  @Column({ type: 'varchar', length: 20 })
  status!: string;

  // Base product price. Kept as a string (TypeORM's default `numeric`
  // mapping) to avoid float precision loss — never Number(product.price).
  @Column({ type: 'numeric', precision: 18, scale: 4, nullable: true })
  price!: string | null;

  // ISO 4217 currency, e.g. USD. A bare price without this is meaningless.
  @Column({ type: 'char', length: 3, name: 'currency_code', nullable: true })
  currencyCode!: string | null;

  // Commercial unit, e.g. kg, piece, box.
  @Column({ type: 'varchar', length: 50, nullable: true })
  unit!: string | null;

  // Minimum Order Quantity.
  @Column({ type: 'numeric', precision: 18, scale: 4, nullable: true })
  moq!: string | null;

  @Column({ type: 'varchar', length: 20, name: 'hs_code', nullable: true })
  hsCode!: string | null;

  @ManyToOne(() => Country, { nullable: true, onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'source_country_id' })
  sourceCountry!: Country | null;

  @Column({ type: 'uuid', name: 'source_country_id', nullable: true })
  sourceCountryId!: string | null;

  // Informational export eligibility value; vocabulary TBD.
  @Column({ type: 'varchar', length: 50, name: 'export_eligibility', nullable: true })
  exportEligibility!: string | null;

  @Column({ type: 'text', name: 'country_restrictions', nullable: true })
  countryRestrictions!: string | null;

  // Display text such as "10-15 business days".
  @Column({ type: 'varchar', length: 150, name: 'estimated_delivery_text', nullable: true })
  estimatedDeliveryText!: string | null;

  @Column({ type: 'text', name: 'duties_taxes_note', nullable: true })
  dutiesTaxesNote!: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdByUser!: User;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'updated_by' })
  updatedByUser!: User;

  @Column({ type: 'uuid', name: 'updated_by' })
  updatedBy!: string;

  // Latest/initial publication timestamp; exact audit semantics can evolve.
  @Column({ type: 'timestamptz', name: 'published_at', nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
