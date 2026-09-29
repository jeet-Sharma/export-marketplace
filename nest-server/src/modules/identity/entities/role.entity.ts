import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * PART 2.11 — role (Data_Modeling_Complete.md, Document 6 v3).
 *
 * A role by itself does nothing — it is a name tag. The actual power comes
 * from role_permission. Code must check permissions
 * (`user.can('product.approve')`), never role names
 * (`role == 'VENDOR_CHECKER'`), so an admin can change what a role can do
 * without a code release.
 *
 * No seed rows (SUPER_ADMIN, VENDOR_OWNER, BUYER, etc.) are inserted in
 * this database-only pass — bootstrap/seed data is a deliberate follow-up
 * once the auth layer exists.
 *
 * Schema is owned by the CreateCompaniesPeopleAccess migration.
 */
@Entity({ name: 'role' })
export class RoleEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'text', unique: true })
  code!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ name: 'scope_type', type: 'text' })
  scopeType!: 'PLATFORM' | 'VENDOR' | 'BUYER';

  @Column({ name: 'is_system', type: 'boolean', default: false, comment: 'Built-in; admin cannot delete' })
  isSystem!: boolean;

  @Column({ type: 'text', nullable: true })
  description!: string | null;
}
