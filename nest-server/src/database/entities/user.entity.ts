import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vendor } from './vendor.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Uniqueness is enforced in the DB via a normalized lower(email) index
  // (see the migration) rather than a plain column-level UNIQUE, so this
  // is intentionally not marked `unique: true` here — TypeORM would
  // otherwise try to (re)create a plain unique constraint that duplicates
  // and conflicts with the normalized one.
  @Column({ type: 'varchar', length: 320 })
  email!: string;

  // Never log or serialize this field — see security-rules.md.
  @Column({ type: 'text', name: 'password_hash' })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName!: string;

  // Suggested values: ACTIVE, INACTIVE.
  @Column({ type: 'varchar', length: 30 })
  status!: string;

  @Column({ type: 'timestamptz', name: 'last_login_at', nullable: true })
  lastLoginAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;

  // NULL for Platform Users; set for Vendor Users once Vendor login exists.
  @ManyToOne(() => Vendor, { nullable: true, onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'vendor_id' })
  @Index()
  vendor!: Vendor | null;

  @Column({ type: 'uuid', name: 'vendor_id', nullable: true })
  vendorId!: string | null;
}
