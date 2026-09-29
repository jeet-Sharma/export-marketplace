import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * PART 2.11 — permission (Data_Modeling_Complete.md, Document 6 v3).
 *
 * One row = one action a person can do, e.g. `product.create`,
 * `order.accept`, `payout.run`. No seed rows in this database-only pass.
 *
 * Schema is owned by the CreateCompaniesPeopleAccess migration.
 */
@Entity({ name: 'permission' })
export class PermissionEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ type: 'text', unique: true })
  code!: string;

  @Column({ type: 'text', comment: "e.g. 'Products', 'Orders'" })
  module!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;
}
