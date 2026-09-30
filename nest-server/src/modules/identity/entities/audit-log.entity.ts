import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { OrganizationEntity } from './organization.entity.js';
import { UserEntity } from './user.entity.js';

/**
 * PART 2.13 — audit_log (Data_Modeling_Complete.md, Document 6 v3, G-06).
 *
 * Append-only proof trail for every sensitive admin action
 * (user.block, role.grant, vendor.approve, bank_account.change, ...).
 * `before`/`after` are JSONB because each action's shape differs and the
 * log is read only during investigations. This table grows forever and is
 * the first candidate for monthly partitioning (Part 13.5) once volume
 * warrants it — not built in this pass.
 *
 * Schema is owned by the CreateCompaniesPeopleAccess migration.
 */
@Entity({ name: 'audit_log' })
@Index('IDX_audit_log_entity', ['entityType', 'entityId', 'createdAt'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Index()
  @Column({ name: 'actor_user_id', type: 'bigint', nullable: true, comment: 'Empty for system jobs' })
  actorUserId!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'actor_user_id' })
  actorUser?: Relation<UserEntity>;

  @Column({ name: 'actor_org_id', type: 'bigint', nullable: true, comment: "Actor's company at that moment" })
  actorOrgId!: string | null;

  @ManyToOne(() => OrganizationEntity, { nullable: true })
  @JoinColumn({ name: 'actor_org_id' })
  actorOrg?: Relation<OrganizationEntity>;

  @Column({ type: 'text', comment: "e.g. 'user.block', 'role.grant', 'vendor.approve'" })
  action!: string;

  @Column({ name: 'entity_type', type: 'text', comment: "e.g. 'users', 'organization', 'role'" })
  entityType!: string;

  @Column({ name: 'entity_id', type: 'bigint' })
  entityId!: string;

  @Column({ type: 'jsonb', nullable: true, comment: 'State before' })
  before!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true, comment: 'State after' })
  after!: Record<string, unknown> | null;

  @Column({ type: 'inet', nullable: true })
  ip!: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}
