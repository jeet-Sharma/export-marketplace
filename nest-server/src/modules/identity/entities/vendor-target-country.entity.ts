import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm';
import { CountryEntity } from '../../reference-data/entities/country.entity.js';
import { CurrencyEntity } from '../../reference-data/entities/currency.entity.js';
import { OrganizationEntity } from './organization.entity.js';

/**
 * PART 2.3 — vendor_target_country (Data_Modeling_Complete.md, Document 6 v3).
 *
 * The `UNIQUE (organization_id, target_country)` constraint (migration) is
 * also the target of `product_target_country`'s composite foreign key
 * (Part 3.2, not built yet) — that FK is what makes it physically
 * impossible for a product to target a country its vendor hasn't declared
 * (H-16).
 *
 * Schema is owned by the CreateCompaniesPeopleAccess migration.
 */
@Entity({ name: 'vendor_target_country' })
@Index('IDX_vendor_target_country_org_country', ['organizationId', 'targetCountry'], { unique: true })
export class VendorTargetCountryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'organization_id', type: 'bigint' })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'organization_id' })
  organization?: Relation<OrganizationEntity>;

  @Index()
  @Column({ name: 'target_country', type: 'char', length: 2 })
  targetCountry!: string;

  @ManyToOne(() => CountryEntity)
  @JoinColumn({ name: 'target_country' })
  targetCountryRef?: Relation<CountryEntity>;

  @Column({ name: 'target_currency', type: 'char', length: 3 })
  targetCurrency!: string;

  @ManyToOne(() => CurrencyEntity)
  @JoinColumn({ name: 'target_currency' })
  targetCurrencyRef?: Relation<CurrencyEntity>;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
