import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * PART 1.1 — currency (Data_Modeling_Complete.md, Document 6 v3).
 *
 * Exactly one row may have is_base = true (enforced by the
 * currency_one_base partial unique index in the CreateReferenceData
 * migration) — every report that converts to base must have a single,
 * unambiguous base to convert to (H-28).
 *
 * Schema is owned by the CreateReferenceData migration; column types here
 * mirror the SQL there (the structural equivalent of the d_ccy domain,
 * since TypeORM entities can't reference a PostgreSQL domain by name).
 */
@Entity({ name: 'currency' })
export class CurrencyEntity {
  @PrimaryColumn({ type: 'char', length: 3, comment: 'ISO 4217 code (d_ccy domain), e.g. USD, INR' })
  code!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  symbol!: string;

  @Column({ name: 'decimal_places', type: 'smallint', default: 2 })
  decimalPlaces!: number;

  @Column({ name: 'is_base', type: 'boolean', default: false })
  isBase!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
