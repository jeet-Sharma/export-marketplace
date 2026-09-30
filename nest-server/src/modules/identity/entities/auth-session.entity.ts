import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { UserEntity } from './user.entity.js';

/**
 * PART 2.6 — auth_session (Data_Modeling_Complete.md, Document 6 v3, G-07).
 *
 * Enables "log out of all devices" and ensures blocking a user revokes
 * their live sessions in the same transaction. refresh_token_hash stores
 * the token scrambled, never the real token — no auth flow issues or reads
 * this table yet in this database-only pass.
 *
 * Schema is owned by the CreateCompaniesPeopleAccess migration.
 */
@Entity({ name: 'auth_session' })
export class AuthSessionEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Index()
  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user?: Relation<UserEntity>;

  @Column({ name: 'refresh_token_hash', type: 'text', unique: true })
  refreshTokenHash!: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'inet', nullable: true })
  ip!: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt!: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true, comment: 'Set on logout, rotation, block, or password change' })
  revokedAt!: Date | null;

  // ROTATED = the session was superseded by a refresh-token rotation (normal
  // use), as opposed to LOGOUT (user chose to sign out). Kept distinct so the
  // audit trail doesn't read every token refresh as a logout.
  @Column({ name: 'revoked_reason', type: 'text', nullable: true })
  revokedReason!: 'LOGOUT' | 'ROTATED' | 'USER_BLOCKED' | 'PASSWORD_CHANGED' | 'ADMIN' | null;
}
