import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CurrencyEntity } from './currency.entity.js';

/**
 * PART 1.3 — exchange_rate (Data_Modeling_Complete.md, Document 6 v3, H-28).
 *
 * Append-only: rows are never updated, only added. Every checkout/order
 * locks the exchange_rate_id it used, so any invoice can be traced back to
 * the exact rate row that produced its converted amounts (Part I rule 10 —
 * history/log-style tables are add-only).
 *
 * Schema is owned by the CreateReferenceData migration.
 */
@Entity({ name: 'exchange_rate' })
export class ExchangeRateEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: string;

  @Index()
  @Column({ name: 'from_currency', type: 'char', length: 3 })
  fromCurrency!: string;

  @ManyToOne(() => CurrencyEntity)
  @JoinColumn({ name: 'from_currency' })
  fromCurrencyRef?: CurrencyEntity;

  @Index()
  @Column({ name: 'to_currency', type: 'char', length: 3 })
  toCurrency!: string;

  @ManyToOne(() => CurrencyEntity)
  @JoinColumn({ name: 'to_currency' })
  toCurrencyRef?: CurrencyEntity;

  @Column({ type: 'numeric', precision: 18, scale: 8, comment: 'd_rate domain' })
  rate!: string;

  @Column({ name: 'markup_percent', type: 'numeric', precision: 6, scale: 3, nullable: true, comment: 'd_percent domain' })
  markupPercent!: string | null;

  @Column({ name: 'effective_rate', type: 'numeric', precision: 18, scale: 8, comment: 'd_rate domain' })
  effectiveRate!: string;

  @Column({ type: 'text' })
  source!: string;

  @CreateDateColumn({ name: 'fetched_at', type: 'timestamptz' })
  fetchedAt!: Date;

  @Column({ name: 'valid_until', type: 'timestamptz' })
  validUntil!: Date;
}
