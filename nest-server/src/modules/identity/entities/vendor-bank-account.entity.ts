import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm';
import { CurrencyEntity } from '../../reference-data/entities/currency.entity.js';
import { OrganizationEntity } from './organization.entity.js';
import { UserEntity } from './user.entity.js';

/**
 * PART 2.4 — vendor_bank_account (Data_Modeling_Complete.md, Document 6 v3, G-02).
 *
 * account_number_enc is declared here as raw bytea only; KMS
 * encryption/decryption is an application-layer concern deferred to when
 * auth is implemented. account_number_last4 is the harmless display field
 * (Part 0.9's pattern for every encrypted column).
 *
 * Schema is owned by the CreateCompaniesPeopleAccess migration.
 */
@Entity({ name: 'vendor_bank_account' })
export class VendorBankAccountEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Index()
  @Column({ name: 'organization_id', type: 'bigint' })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'organization_id' })
  organization?: Relation<OrganizationEntity>;

  @Column({ name: 'account_holder_name', type: 'text' })
  accountHolderName!: string;

  @Column({ name: 'account_number_enc', type: 'bytea', comment: 'Encrypted (KMS integration deferred)' })
  accountNumberEnc!: Buffer;

  @Column({ name: 'account_number_last4', type: 'char', length: 4, comment: 'For display: •••• 4821' })
  accountNumberLast4!: string;

  @Column({ name: 'ifsc_code', type: 'text', nullable: true, comment: 'Indian banks' })
  ifscCode!: string | null;

  @Column({ name: 'swift_code', type: 'text', nullable: true, comment: 'Overseas' })
  swiftCode!: string | null;

  @Column({ name: 'bank_name', type: 'text' })
  bankName!: string;

  @Column({ type: 'text', nullable: true })
  branch!: string | null;

  @Column({ type: 'char', length: 3, comment: 'Account currency' })
  currency!: string;

  @ManyToOne(() => CurrencyEntity)
  @JoinColumn({ name: 'currency' })
  currencyRef?: Relation<CurrencyEntity>;

  @Column({ name: 'verification_status', type: 'text', default: 'PENDING', comment: 'Penny-drop test result' })
  verificationStatus!: 'PENDING' | 'VERIFIED' | 'FAILED';

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @Column({ name: 'is_primary', type: 'boolean', default: false, comment: 'Payouts go here' })
  isPrimary!: boolean;

  @Column({ type: 'text', default: 'ACTIVE' })
  status!: 'ACTIVE' | 'INACTIVE';

  @Column({ name: 'created_by', type: 'bigint', nullable: true })
  createdBy!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByRef?: Relation<UserEntity>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
