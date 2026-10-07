import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity.js';

// Stores multiple product images whose binary objects live in AWS S3.
// Keep a stable S3 object key here, never a temporary signed URL — see
// marketplace-domain.md's AWS S3 Image Storage section.
@Entity('product_images')
@Index(['productId', 'sortOrder'])
// Enforces "at most one primary image per product" at the DB level — see
// migration 1759751600000-AddProductImagePrimaryUniqueIndex. A plain
// UNIQUE(productId, isPrimary) would be wrong here since it would also
// forbid multiple non-primary images per product.
@Index('UQ_product_images_product_id_primary', ['productId'], { unique: true, where: '"is_primary" = true' })
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT', onUpdate: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @Column({ type: 'text', name: 's3_object_key' })
  s3ObjectKey!: string;

  // Accessible image description.
  @Column({ type: 'varchar', length: 250, name: 'alt_text', nullable: true })
  altText!: string | null;

  // Marks primary catalogue image.
  @Column({ type: 'boolean', name: 'is_primary' })
  isPrimary!: boolean;

  @Column({ type: 'int', name: 'sort_order' })
  sortOrder!: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;
}
