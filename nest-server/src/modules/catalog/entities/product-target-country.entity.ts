import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm';
import { ProductEntity } from './product.entity.js';

/**
 * PART 3.2 — product_target_country (Data_Modeling_Complete.md, Document 6 v3, H-16).
 *
 * A product's countries must come from its vendor's own list (Document 4
 * rule B.4.1). Enforced by TWO foreign keys in the migration:
 *   FK (product_id, organization_id) -> product (id, organization_id)
 *   FK (organization_id, target_country) -> vendor_target_country (organization_id, target_country)
 * Neither FK can be expressed by a single @ManyToOne here since both are
 * composite; they are migration-only (see CreateVendorCatalog).
 *
 * IMPORTANT: target_country's real FK target (combined with
 * organization_id) is vendor_target_country, NOT the plain country
 * reference table — there is no direct FK from this column to `country`
 * at all. An earlier version of this entity declared
 * @ManyToOne(() => CountryEntity) here, which pointed the relation at the
 * wrong table; ProductTargetCountriesService.upsert() already does the
 * real check this relation should reflect (looking up
 * VendorTargetCountryEntity by organizationId + targetCountry before
 * allowing the row — H-16's vendor-country pre-check), so no relation is
 * declared on this column at all rather than one that misrepresents the
 * schema.
 *
 * Schema is owned by the CreateVendorCatalog migration.
 */
@Entity({ name: 'product_target_country' })
@Index('IDX_ptc_product_country', ['productId', 'targetCountry'], { unique: true })
export class ProductTargetCountryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'product_id', type: 'bigint' })
  productId!: string;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product?: Relation<ProductEntity>;

  @Column({ name: 'organization_id', type: 'bigint', comment: 'Copy of the owner, for the composite FKs and RLS' })
  organizationId!: string;

  // target_country: no @ManyToOne/@JoinColumn on this column — see class
  // doc comment. Its real FK (combined with organization_id) targets
  // VendorTargetCountryEntity, a composite relation TypeORM decorators
  // can't express on a single column, so none is declared here rather
  // than one pointing at the wrong table.
  @Column({ name: 'target_country', type: 'char', length: 2 })
  targetCountry!: string;

  @Column({
    name: 'national_tariff_code',
    type: 'text',
    nullable: true,
    comment: "Destination's 8-10 digit code, e.g. US HTS 0910300000",
  })
  nationalTariffCode!: string | null;

  @Column({ name: 'is_allowed', type: 'boolean', default: true, comment: 'May it be sold there' })
  isAllowed!: boolean;

  @Column({ name: 'block_reason', type: 'text', nullable: true, comment: 'Required when not allowed' })
  blockReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
