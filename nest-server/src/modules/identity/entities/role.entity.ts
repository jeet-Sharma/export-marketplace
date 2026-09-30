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
 * Only the BUYER row is seeded so far (see the SeedBuyerRole migration),
 * since buyer registration is the one auth flow that exists today. The
 * rest of the catalog (SUPER_ADMIN, VENDOR_OWNER, VENDOR_MAKER,
 * VENDOR_CHECKER, ADMIN, etc., and any role_permission rows) is added when
 * the vendor/platform auth flows are built.
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
