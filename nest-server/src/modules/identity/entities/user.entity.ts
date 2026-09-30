import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm';
import { OrganizationEntity } from './organization.entity.js';

/**
 * PART 2.5 — users (Data_Modeling_Complete.md, Document 6 v3, M-01).
 *
 * Renamed from `user` in the v2 doc — `user` is a reserved word in
 * PostgreSQL. All three person types (PLATFORM admin, VENDOR staff, BUYER)
 * live in this one table; `user_type` plus whether `organization_id` is set
 * determines which panel/role set applies. Buyers always have
 * organization_id = NULL (enforced by a CHECK in the migration).
 *
 * The case-insensitive unique index on email (`users_email_uq` on
 * `lower(email)`) and the org_type-match trigger
 * (`check_user_org_type_match`) are migration-only — TypeORM's decorators
 * can't express either, so they are not repeated here as decorators.
 *
 * Schema is owned by the CreateCompaniesPeopleAccess migration.
 */
@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'public_id', type: 'uuid', unique: true })
  publicId!: string;

  @Column({ name: 'user_type', type: 'text', comment: "'PLATFORM', 'VENDOR', or 'BUYER' — the default panel" })
  userType!: 'PLATFORM' | 'VENDOR' | 'BUYER';

  @Index()
  @Column({ name: 'organization_id', type: 'bigint', nullable: true, comment: 'Always empty for a BUYER' })
  organizationId!: string | null;

  @ManyToOne(() => OrganizationEntity, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization?: Relation<OrganizationEntity>;

  @Column({ name: 'full_name', type: 'text' })
  fullName!: string;

  @Column({ type: 'text', comment: 'Login email — case-insensitive uniqueness enforced in the migration' })
  email!: string;

  @Column({ type: 'text', nullable: true })
  phone!: string | null;

  @Column({
    name: 'password_hash',
    type: 'text',
    nullable: true,
    comment: 'argon2id/bcrypt hash. Empty for Google-only users and invitees who have not set a password yet',
  })
  passwordHash!: string | null;

  @Column({ name: 'auth_provider', type: 'text', default: 'LOCAL' })
  authProvider!: 'LOCAL' | 'GOOGLE';

  @Column({ name: 'email_verified', type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'text', default: 'PENDING' })
  status!: 'PENDING' | 'ACTIVE' | 'BLOCKED' | 'ANONYMISED';

  @Column({ name: 'failed_login_count', type: 'int', default: 0, comment: 'Brute-force protection' })
  failedLoginCount!: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @Column({ name: 'password_changed_at', type: 'timestamptz', nullable: true, comment: 'Sessions issued before this are invalid' })
  passwordChangedAt!: Date | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ name: 'anonymised_at', type: 'timestamptz', nullable: true, comment: 'Set by the GDPR/DPDP erasure procedure' })
  anonymisedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
