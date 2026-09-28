import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { CurrencyEntity } from './currency.entity.js';

/**
 * PART 1.2 — country (Data_Modeling_Complete.md, Document 6 v3, G-01).
 *
 * About 15 columns across the eventual schema hold a country. Without this
 * master table they would be free text ('UAE', 'AE', 'U.A.E' all "valid").
 * With it, every country column gets a real foreign key, and a sanctioned
 * destination is switched off in one place (`is_sanctioned`).
 *
 * Schema is owned by the CreateReferenceData migration; see currency.entity.ts
 * for why column types here are the structural equivalent of the PostgreSQL
 * domains rather than the domain names themselves.
 */
@Entity({ name: 'country' })
export class CountryEntity {
  @PrimaryColumn({ type: 'char', length: 2, comment: 'ISO 3166-1 alpha-2 code (d_country domain), e.g. US, IN' })
  code!: string;

  @Column({ type: 'char', length: 3, unique: true })
  iso3!: string;

  @Column({ type: 'text' })
  name!: string;

  @Index()
  @Column({ name: 'default_currency', type: 'char', length: 3, nullable: true })
  defaultCurrency!: string | null;

  @ManyToOne(() => CurrencyEntity, { nullable: true })
  @JoinColumn({ name: 'default_currency' })
  defaultCurrencyRef?: CurrencyEntity;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'is_sanctioned', type: 'boolean', default: false, comment: 'Trade blocked by law — no vendor or product may target it' })
  isSanctioned!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
