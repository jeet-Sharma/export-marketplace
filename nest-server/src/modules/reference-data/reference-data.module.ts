import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from './entities/category.entity.js';
import { CountryEntity } from './entities/country.entity.js';
import { CurrencyEntity } from './entities/currency.entity.js';
import { ExchangeRateEntity } from './entities/exchange-rate.entity.js';
import { HsCodeEntity } from './entities/hs-code.entity.js';

/**
 * PART 1 — Reference Data (Data_Modeling_Complete.md, Document 6 v3).
 *
 * Registers the small, rarely-changing reference tables (currency, country,
 * exchange_rate, category, hs_code) as TypeORM entities. No controller or
 * service yet — this is a database-schema-only pass; later parts of the
 * domain model (products, orders, etc.) will reference these entities via
 * foreign keys as they're built.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([CurrencyEntity, CountryEntity, ExchangeRateEntity, CategoryEntity, HsCodeEntity]),
  ],
  exports: [TypeOrmModule],
})
export class ReferenceDataModule {}
