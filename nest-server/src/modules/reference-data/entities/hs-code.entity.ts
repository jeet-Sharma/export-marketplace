import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * PART 1.5 — hs_code (Data_Modeling_Complete.md, Document 6 v3).
 *
 * Harmonized System codes used to classify products for customs/compliance
 * purposes. Schema is owned by the CreateReferenceData migration.
 */
@Entity({ name: 'hs_code' })
export class HsCodeEntity {
  @PrimaryColumn({ type: 'char', length: 6, comment: '6-digit HS code' })
  code!: string;

  @Column({ name: 'hs_version', type: 'text' })
  hsVersion!: string;

  @Column({ type: 'text' })
  description!: string;

  @Index()
  @Column({ type: 'char', length: 2 })
  chapter!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
