import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm';
import { CountryEntity } from '../../reference-data/entities/country.entity.js';
import { CurrencyEntity } from '../../reference-data/entities/currency.entity.js';
import { UserEntity } from './user.entity.js';

/**
 * PART 2.1 — organization (Data_Modeling_Complete.md, Document 6 v3).
 *
 * One row = one vendor company, plus exactly one row for the platform
 * itself (org_type = 'PLATFORM', enforced by a partial unique index in the
 * migration). Buyers never get a row here — a buyer is a plain `users` row
 * with organization_id = NULL.
 *
 * pan_enc is declared here as raw bytea only; KMS encryption/decryption is
 * an application-layer concern deferred to when auth` is implemented (see
 * migration file header).
 *
 * Schema is owned by the CreateCompaniesPeopleAccess migration; see
 * currency.entity.ts for why column types here are the structural
 * equivalent of the PostgreSQL domains rather than the domain names
 * themselves.
 */
@Entity({ name: 'organization' })
export class OrganizationEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'public_id', type: 'uuid', unique: true })
  publicId!: string;

  @Column({ name: 'org_type', type: 'text', comment: "'PLATFORM' (one row only) or 'VENDOR'" })
  orgType!: 'PLATFORM' | 'VENDOR';

  @Column({ name: 'legal_name', type: 'text' })
  legalName!: string;

  @Column({ name: 'display_name', type: 'text' })
  displayName!: string;

  @Column({ type: 'text' })
  email!: string;

  @Column({ type: 'text', nullable: true })
  phone!: string | null;

  @Index()
  @Column({ name: 'source_country', type: 'char', length: 2, nullable: true })
  sourceCountry!: string | null;

  @ManyToOne(() => CountryEntity, { nullable: true })
  @JoinColumn({ name: 'source_country' })
  sourceCountryRef?: Relation<CountryEntity>;

  @Column({ name: 'source_currency', type: 'char', length: 3, nullable: true })
  sourceCurrency!: string | null;

  @ManyToOne(() => CurrencyEntity, { nullable: true })
  @JoinColumn({ name: 'source_currency' })
  sourceCurrencyRef?: Relation<CurrencyEntity>;

  @Column({ name: 'settlement_currency', type: 'char', length: 3, nullable: true, comment: "Currency the vendor is paid out in (usually = source_currency)" })
  settlementCurrency!: string | null;

  @ManyToOne(() => CurrencyEntity, { nullable: true })
  @JoinColumn({ name: 'settlement_currency' })
  settlementCurrencyRef?: Relation<CurrencyEntity>;

  @Column({ name: 'address_line1', type: 'text', nullable: true })
  addressLine1!: string | null;

  @Column({ name: 'address_line2', type: 'text', nullable: true })
  addressLine2!: string | null;

  @Column({ type: 'text', nullable: true })
  city!: string | null;

  @Column({ type: 'text', nullable: true })
  state!: string | null;

  @Column({ name: 'postal_code', type: 'text', nullable: true })
  postalCode!: string | null;

  @Index()
  @Column({ type: 'char', length: 2, nullable: true, comment: 'Office country' })
  country!: string | null;

  @ManyToOne(() => CountryEntity, { nullable: true })
  @JoinColumn({ name: 'country' })
  countryRef?: CountryEntity;

  @Column({ type: 'text', nullable: true, comment: 'GST number — printed on invoices, not secret' })
  gstin!: string | null;

  @Column({ name: 'iec_code', type: 'text', nullable: true, comment: 'Import-Export Code' })
  iecCode!: string | null;

  @Column({ name: 'pan_enc', type: 'bytea', nullable: true, comment: 'PAN, encrypted (KMS integration deferred)' })
  panEnc!: Buffer | null;

  @Column({
    name: 'requires_second_approver',
    type: 'boolean',
    default: true,
    comment: "If true, a product's creator can never approve it at the Checker step",
  })
  requiresSecondApprover!: boolean;

  @Index()
  @Column({ type: 'text', default: 'PENDING' })
  status!: 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'BLOCKED';

  @Column({ name: 'approved_by', type: 'bigint', nullable: true })
  approvedBy!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedByRef?: Relation<UserEntity>;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ name: 'row_version', type: 'int', default: 1, comment: 'Lost-update guard' })
  rowVersion!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
