import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { OrganizationEntity } from './organization.entity.js';
import { UserEntity } from './user.entity.js';

/**
 * PART 2.2 — organization_status_history (Data_Modeling_Complete.md,
 * Document 6 v3, G-06). Append-only: rows are never updated or deleted —
 * this is the proof trail for "who suspended this vendor, when, and why."
 *
 * Schema is owned by the CreateCompaniesPeopleAccess migration.
 */
@Entity({ name: 'organization_status_history' })
export class OrganizationStatusHistoryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Index()
  @Column({ name: 'organization_id', type: 'bigint' })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'organization_id' })
  organization?: Relation<OrganizationEntity>;

  @Column({ name: 'from_status', type: 'text', nullable: true, comment: 'Empty for the first row (registration)' })
  fromStatus!: string | null;

  @Column({ name: 'to_status', type: 'text' })
  toStatus!: string;

  @Column({ name: 'changed_by', type: 'bigint', nullable: true })
  changedBy!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  changedByRef?: Relation<UserEntity>;

  @Column({ type: 'text', nullable: true, comment: 'Required when to_status is SUSPENDED or BLOCKED' })
  reason!: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;
}
