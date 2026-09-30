import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, type Relation } from 'typeorm';
import { PermissionEntity } from './permission.entity.js';
import { RoleEntity } from './role.entity.js';

/**
 * PART 2.11 — role_permission (Data_Modeling_Complete.md, Document 6 v3, H-12).
 *
 * Joins role and permission. The composite primary key (role_id,
 * permission_id) is the whole point — a role either has a permission or
 * it doesn't, no duplicate rows possible.
 *
 * Schema is owned by the CreateCompaniesPeopleAccess migration.
 */
@Entity({ name: 'role_permission' })
export class RolePermissionEntity {
  @PrimaryColumn({ name: 'role_id', type: 'bigint' })
  roleId!: string;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'role_id' })
  role?: Relation<RoleEntity>;

  @Index()
  @PrimaryColumn({ name: 'permission_id', type: 'bigint' })
  permissionId!: string;

  @ManyToOne(() => PermissionEntity)
  @JoinColumn({ name: 'permission_id' })
  permission?: Relation<PermissionEntity>;
}
