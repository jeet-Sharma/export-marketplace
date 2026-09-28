import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * PART 1.4 — category (Data_Modeling_Complete.md, Document 6 v3).
 *
 * A simple parent link (adjacency list) is enough: the tree is a few
 * hundred rows, cached in memory in the application, with breadcrumbs built
 * there rather than via recursive queries on every page (no caching layer
 * exists yet in this database-only pass).
 *
 * Schema is owned by the CreateReferenceData migration.
 */
@Entity({ name: 'category' })
export class CategoryEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Index()
  @Column({ name: 'parent_id', type: 'bigint', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => CategoryEntity, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: CategoryEntity | null;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', unique: true, comment: 'URL-friendly name' })
  slug!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
