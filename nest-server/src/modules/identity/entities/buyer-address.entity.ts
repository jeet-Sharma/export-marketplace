import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm';
import { CountryEntity } from '../../reference-data/entities/country.entity.js';
import { UserEntity } from './user.entity.js';

/**
 * PART 2.10 — buyer_address (Data_Modeling_Complete.md, Document 6 v3).
 *
 * The buyer's editable address book. Orders never rely on this table after
 * being placed — the chosen address is copied (JSONB) onto the order at
 * checkout time (Part 7.2, not built yet, M-05) — so editing or archiving
 * an address here never changes a past invoice.
 *
 * Schema is owned by the CreateCompaniesPeopleAccess migration.
 */
@Entity({ name: 'buyer_address' })
export class BuyerAddressEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user?: Relation<UserEntity>;

  @Column({ type: 'text', nullable: true, comment: "e.g. 'Home', 'Office', 'Warehouse'" })
  label!: string | null;

  @Column({ name: 'contact_name', type: 'text' })
  contactName!: string;

  @Column({ name: 'contact_phone', type: 'text' })
  contactPhone!: string;

  @Column({ name: 'address_line1', type: 'text' })
  addressLine1!: string;

  @Column({ name: 'address_line2', type: 'text', nullable: true })
  addressLine2!: string | null;

  @Column({ type: 'text' })
  city!: string;

  @Column({ type: 'text', nullable: true })
  state!: string | null;

  @Column({ name: 'postal_code', type: 'text', nullable: true })
  postalCode!: string | null;

  @Column({ type: 'char', length: 2 })
  country!: string;

  @ManyToOne(() => CountryEntity)
  @JoinColumn({ name: 'country' })
  countryRef?: Relation<CountryEntity>;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'text', default: 'ACTIVE', comment: "'delete' archives rather than removing the row" })
  status!: 'ACTIVE' | 'ARCHIVED';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
