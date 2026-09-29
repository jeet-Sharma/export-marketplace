import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { UserEntity } from './user.entity.js';

/**
 * PART 2.8 — user_social_account (Data_Modeling_Complete.md, Document 6 v3).
 *
 * Links a third-party sign-in (currently only GOOGLE) to an existing user,
 * matched by lower(email), so a Google sign-in never creates a second
 * account for the same person.
 *
 * Schema is owned by the CreateCompaniesPeopleAccess migration.
 */
@Entity({ name: 'user_social_account' })
@Index('IDX_user_social_account_provider_user', ['provider', 'providerUserId'], { unique: true })
@Index('IDX_user_social_account_user_provider', ['userId', 'provider'], { unique: true })
export class UserSocialAccountEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user?: Relation<UserEntity>;

  @Column({ type: 'text' })
  provider!: 'GOOGLE';

  @Column({ name: 'provider_user_id', type: 'text', comment: "Google's own id for this person" })
  providerUserId!: string;

  @Column({ name: 'provider_email', type: 'text', nullable: true })
  providerEmail!: string | null;

  @Column({ name: 'linked_at', type: 'timestamptz', default: () => 'now()' })
  linkedAt!: Date;
}
