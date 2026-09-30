import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { RoleEntity } from './role.entity.js';
import { UserEntity } from './user.entity.js';

/**
 * PART 2.12 — user_role (Data_Modeling_Complete.md, Document 6 v3, H-12).
 *
 * Which person has which job. organization_id is deliberately NOT a column
 * here — the company is already on users.organization_id, and a second
 * copy could disagree with it. The scope-match trigger
 * (`check_user_role_scope_match`, migration-only) enforces that a
 * VENDOR-scope role can only go to a user in a VENDOR organization, a
 * PLATFORM-scope role only to a PLATFORM user, and a BUYER-scope role only
 * to a BUYER user.
 *
 * Maker and Checker MAY be held by the same person here — the rule that
 * matters ("nobody approves their own product") is enforced on the
 * approval statement itself (Part 3.1, not built in this pass), not by
 * blocking this role combination.
 *
 * Schema is owned by the CreateCompaniesPeopleAccess migration.
 */
@Entity({ name: 'user_role' })
@Index('IDX_user_role_user_role', ['userId', 'roleId'], { unique: true })
export class UserRoleEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId!: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user?: Relation<UserEntity>;

  @Column({ name: 'role_id', type: 'bigint' })
  roleId!: string;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'role_id' })
  role?: Relation<RoleEntity>;

  @Column({ name: 'assigned_by', type: 'bigint', nullable: true })
  assignedBy!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'assigned_by' })
  assignedByRef?: Relation<UserEntity>;

  @Column({ name: 'assigned_at', type: 'timestamptz', default: () => 'now()' })
  assignedAt!: Date;
}
