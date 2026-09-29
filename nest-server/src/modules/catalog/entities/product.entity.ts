import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm';
import { CategoryEntity } from '../../reference-data/entities/category.entity.js';
import { CurrencyEntity } from '../../reference-data/entities/currency.entity.js';
import { HsCodeEntity } from '../../reference-data/entities/hs-code.entity.js';
import { OrganizationEntity } from '../../identity/entities/organization.entity.js';
import { UserEntity } from '../../identity/entities/user.entity.js';

/**
 * PART 3.1 — product (Data_Modeling_Complete.md, Document 6 v3).
 *
 * Belongs to the company (organization_id), never to the person who typed
 * it in — created_by only records who. Carries the platform's heaviest
 * read traffic (browse and search).
 *
 * pending_changes/pending_status/pending_submitted_by/pending_submitted_at
 * implement M-03: editing a PUBLISHED product keeps it PUBLISHED for
 * buyers while the edit waits for Checker/Admin approval in pending_*; on
 * approval the pending_changes are copied onto the real columns and
 * pending_* is cleared, all in one transaction (application-layer
 * concern, not built in this pass).
 *
 * The self-approval rule ("a product's creator can never approve it at
 * the Checker step", M-02) is enforced by the approve UPDATE statement
 * itself (documented in the schema doc), not by a decorator here — the
 * same pattern already used for check_user_org_type_match in Part 2.
 *
 * search (tsvector), the (id, organization_id) composite unique used by
 * children's composite FKs, and the tier/media/approval-log relations are
 * migration-only or declared on the child side — see
 * CreateVendorCatalog migration for the generated column and indexes.
 *
 * Schema is owned by the CreateVendorCatalog migration.
 */
@Entity({ name: 'product' })
@Index('IDX_product_org_slug', ['organizationId', 'slug'], { unique: true })
export class ProductEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'public_id', type: 'uuid', unique: true })
  publicId!: string;

  @Index()
  @Column({ name: 'organization_id', type: 'bigint' })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'organization_id' })
  organization?: Relation<OrganizationEntity>;

  @Column({ name: 'category_id', type: 'bigint' })
  categoryId!: string;

  @ManyToOne(() => CategoryEntity)
  @JoinColumn({ name: 'category_id' })
  category?: Relation<CategoryEntity>;

  @Column({ name: 'hs_code', type: 'char', length: 6, nullable: true, comment: 'International HS code' })
  hsCode!: string | null;

  @ManyToOne(() => HsCodeEntity, { nullable: true })
  @JoinColumn({ name: 'hs_code' })
  hsCodeRef?: Relation<HsCodeEntity>;

  @Column({ type: 'text', comment: 'Name in the default language' })
  name!: string;

  @Column({ name: 'name_i18n', type: 'jsonb', nullable: true, comment: '{"ar": "...", "fr": "..."}' })
  nameI18n!: Record<string, string> | null;

  @Column({ type: 'text', comment: 'URL name, unique within the company' })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'description_i18n', type: 'jsonb', nullable: true })
  descriptionI18n!: Record<string, string> | null;

  @Column({ type: 'text', nullable: true, comment: "Vendor's own item code" })
  sku!: string | null;

  @Column({
    type: 'jsonb',
    default: {},
    comment: 'Category-specific specs: {"purity_pct": 98, "moisture_pct": 10}',
  })
  attributes!: Record<string, unknown>;

  @Column({
    name: 'base_price',
    type: 'numeric',
    precision: 19,
    scale: 4,
    comment: 'Price per unit in base_currency (used when no tier matches)',
  })
  basePrice!: string;

  @Column({ name: 'base_currency', type: 'char', length: 3, comment: "Usually the vendor's source currency" })
  baseCurrency!: string;

  @ManyToOne(() => CurrencyEntity)
  @JoinColumn({ name: 'base_currency' })
  baseCurrencyRef?: Relation<CurrencyEntity>;

  @Column({ type: 'numeric', precision: 14, scale: 3, comment: 'Minimum order quantity' })
  moq!: string;

  @Column({ type: 'text', comment: "'KG', 'TON', 'PIECE' ..." })
  unit!: string;

  @Column({ name: 'weight_kg', type: 'numeric', precision: 12, scale: 3, nullable: true, comment: 'Weight of one unit, for freight' })
  weightKg!: string | null;

  @Column({ name: 'length_cm', type: 'numeric', precision: 10, scale: 2, nullable: true })
  lengthCm!: string | null;

  @Column({ name: 'width_cm', type: 'numeric', precision: 10, scale: 2, nullable: true })
  widthCm!: string | null;

  @Column({ name: 'height_cm', type: 'numeric', precision: 10, scale: 2, nullable: true })
  heightCm!: string | null;

  @Column({ name: 'is_quote_only', type: 'boolean', default: false, comment: '"Request quote" only — no Buy button' })
  isQuoteOnly!: boolean;

  @Index()
  @Column({ type: 'text', default: 'DRAFT' })
  status!: 'DRAFT' | 'PENDING_CHECKER' | 'PENDING_ADMIN' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'DELISTED';

  @Column({ name: 'pending_changes', type: 'jsonb', nullable: true, comment: 'Proposed edit to a live product (M-03)' })
  pendingChanges!: Record<string, unknown> | null;

  @Column({ name: 'pending_status', type: 'text', nullable: true })
  pendingStatus!: 'PENDING_CHECKER' | 'PENDING_ADMIN' | 'REJECTED' | null;

  @Column({ name: 'pending_submitted_by', type: 'bigint', nullable: true })
  pendingSubmittedBy!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'pending_submitted_by' })
  pendingSubmittedByRef?: Relation<UserEntity>;

  @Column({ name: 'pending_submitted_at', type: 'timestamptz', nullable: true })
  pendingSubmittedAt!: Date | null;

  @Column({ name: 'row_version', type: 'int', default: 1, comment: 'Lost-update guard' })
  rowVersion!: number;

  @Column({ name: 'created_by', type: 'bigint', comment: 'The Maker' })
  createdBy!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'created_by' })
  createdByRef?: Relation<UserEntity>;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true, comment: 'First time it went live' })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
