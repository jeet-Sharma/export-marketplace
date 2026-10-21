import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { ProductEntity } from './product.entity.js';

/**
 * PART 3.4 — product_media (Data_Modeling_Complete.md, Document 6 v3, H-19).
 *
 * storage_key is the path in object storage (e.g. "org/5/product/101/a1b2.jpg"),
 * NOT the full URL — the URL is built at read time so moving to a new CDN
 * domain never means rewriting rows. sha256 detects duplicate/tampered
 * uploads. Only one row per product may have is_primary = true (partial
 * unique index media_one_primary, migration-only).
 *
 * Schema is owned by the CreateVendorCatalog migration.
 */
@Entity({ name: 'product_media' })
export class ProductMediaEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Column({ name: 'product_id', type: 'bigint' })
  productId!: string;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product?: Relation<ProductEntity>;

  @Column({ name: 'organization_id', type: 'bigint' })
  organizationId!: string;

  @Column({ name: 'media_type', type: 'text' })
  mediaType!: 'IMAGE' | 'VIDEO';

  @Column({ name: 'storage_key', type: 'text', comment: 'Path in object storage, e.g. org/5/product/101/a1b2.jpg' })
  storageKey!: string;

  @Column({ name: 'mime_type', type: 'text' })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'bigint' })
  sizeBytes!: string;

  @Column({ type: 'char', length: 64, comment: 'SHA-256 — detects duplicates and tampering' })
  sha256!: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false, comment: 'Main picture' })
  isPrimary!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ name: 'moderation_status', type: 'text', default: 'PENDING' })
  moderationStatus!: 'PENDING' | 'APPROVED' | 'REJECTED';

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
