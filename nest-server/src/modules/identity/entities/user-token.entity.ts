import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { UserEntity } from './user.entity.js';

/**
 * PART 2.7 — user_token (Data_Modeling_Complete.md, Document 6 v3).
 *
 * Covers email verification, password reset, OTP, and invite tokens.
 * token_hash stores the token scrambled, never the real value. This is the
 * one table with an explicit exception to "never delete" (Part 2.7): a
 * nightly cleanup job (not built in this pass) removes tokens expired more
 * than 30 days ago, since a spent token has no business/legal value.
 *
 * Schema is owned by the CreateCompaniesPeopleAccess migration.
 */
@Entity({ name: 'user_token' })
export class UserTokenEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user?: Relation<UserEntity>;

  @Column({ name: 'token_type', type: 'text' })
  tokenType!: 'EMAIL_VERIFY' | 'PASSWORD_RESET' | 'OTP' | 'INVITE';

  @Column({ name: 'token_hash', type: 'text', unique: true })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true, comment: 'Set once — the token can never be used twice' })
  usedAt!: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}
