import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, type Relation, UpdateDateColumn } from 'typeorm';
import { CountryEntity } from '../../reference-data/entities/country.entity.js';
import { CurrencyEntity } from '../../reference-data/entities/currency.entity.js';
import { UserEntity } from './user.entity.js';

/**
 * PART 2.9 — buyer_profile (Data_Modeling_Complete.md, Document 6 v3).
 *
 * One profile per buyer — enforced by user_id being the primary key itself
 * (H-14), not just a unique index. A business buyer (buyer_type =
 * BUSINESS) is still one person with a company name on their profile; they
 * never get an `organization` row — organizations are only for vendors.
 *
 * tax_id_enc is declared here as raw bytea only; KMS encryption is deferred
 * to the application layer (see migration file header).
 *
 * Schema is owned by the CreateCompaniesPeopleAccess migration.
 */
@Entity({ name: 'buyer_profile' })
export class BuyerProfileEntity {
  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @OneToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user?: Relation<UserEntity>;

  @Column({ name: 'buyer_type', type: 'text', default: 'INDIVIDUAL' })
  buyerType!: 'INDIVIDUAL' | 'BUSINESS';

  @Column({ name: 'company_name', type: 'text', nullable: true, comment: 'Required for BUSINESS buyers' })
  companyName!: string | null;

  @Column({ type: 'char', length: 2, nullable: true })
  country!: string | null;

  @ManyToOne(() => CountryEntity, { nullable: true })
  @JoinColumn({ name: 'country' })
  countryRef?: Relation<CountryEntity>;

  @Column({ name: 'preferred_currency', type: 'char', length: 3, nullable: true })
  preferredCurrency!: string | null;

  @ManyToOne(() => CurrencyEntity, { nullable: true })
  @JoinColumn({ name: 'preferred_currency' })
  preferredCurrencyRef?: Relation<CurrencyEntity>;

  @Column({ name: 'preferred_language', type: 'text', nullable: true, comment: "e.g. 'en', 'ar', 'fr'" })
  preferredLanguage!: string | null;

  @Column({ name: 'tax_id_enc', type: 'bytea', nullable: true, comment: 'VAT/tax number, encrypted (KMS integration deferred)' })
  taxIdEnc!: Buffer | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
