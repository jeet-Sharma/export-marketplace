import { registerAs } from '@nestjs/config';
import type { DataSourceOptions } from 'typeorm';
import { AuditLogEntity } from '../modules/identity/entities/audit-log.entity.js';
import { AuthSessionEntity } from '../modules/identity/entities/auth-session.entity.js';
import { BuyerAddressEntity } from '../modules/identity/entities/buyer-address.entity.js';
import { BuyerProfileEntity } from '../modules/identity/entities/buyer-profile.entity.js';
import { OrganizationStatusHistoryEntity } from '../modules/identity/entities/organization-status-history.entity.js';
import { OrganizationEntity } from '../modules/identity/entities/organization.entity.js';
import { PermissionEntity } from '../modules/identity/entities/permission.entity.js';
import { RolePermissionEntity } from '../modules/identity/entities/role-permission.entity.js';
import { RoleEntity } from '../modules/identity/entities/role.entity.js';
import { UserRoleEntity } from '../modules/identity/entities/user-role.entity.js';
import { UserSocialAccountEntity } from '../modules/identity/entities/user-social-account.entity.js';
import { UserTokenEntity } from '../modules/identity/entities/user-token.entity.js';
import { UserEntity } from '../modules/identity/entities/user.entity.js';
import { VendorBankAccountEntity } from '../modules/identity/entities/vendor-bank-account.entity.js';
import { VendorTargetCountryEntity } from '../modules/identity/entities/vendor-target-country.entity.js';
import { CategoryEntity } from '../modules/reference-data/entities/category.entity.js';
import { CountryEntity } from '../modules/reference-data/entities/country.entity.js';
import { CurrencyEntity } from '../modules/reference-data/entities/currency.entity.js';
import { ExchangeRateEntity } from '../modules/reference-data/entities/exchange-rate.entity.js';
import { HsCodeEntity } from '../modules/reference-data/entities/hs-code.entity.js';

export interface DbConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  logging: boolean;
}

/**
 * PostgreSQL / TypeORM configuration, namespaced under "db" in ConfigService.
 *
 * synchronize is always off (see buildDataSourceOptions below) — the domain
 * schema is owned by migrations, not by entity auto-sync, in every
 * environment including local dev. Run "npm run migration:run" after
 * "npm run infra:up" to create the schema.
 *
 * ssl is enabled in production (most managed Postgres providers require it)
 * and disabled locally against the Docker container.
 */
export default registerAs('db', (): DbConfig => {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
    username: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    database: process.env.POSTGRES_DB ?? 'export_marketplace',
    ssl: isProd,
    logging: process.env.TYPEORM_LOGGING === 'true',
  };
});

/**
 * Builds a TypeORM DataSourceOptions object from a DbConfig.
 * Used by DatabaseModule so the TypeORM forRootAsync factory stays clean.
 */
export function buildDataSourceOptions(cfg: DbConfig): DataSourceOptions {
  return {
    type: 'postgres',
    host: cfg.host,
    port: cfg.port,
    username: cfg.username,
    password: cfg.password,
    database: cfg.database,
    ssl: cfg.ssl ? { rejectUnauthorized: false } : false,
    // synchronize is forced off here regardless of environment: the domain
    // schema (Data_Modeling_Complete.md) relies on PostgreSQL features
    // synchronize cannot express (custom domains, generated/STORED columns,
    // exclusion constraints, partial unique indexes) and is owned entirely
    // by the migrations under src/database/migrations. Running synchronize
    // against these entities would fight the migrations on every boot.
    synchronize: false,
    logging: cfg.logging,
    entities: [
      CurrencyEntity,
      CountryEntity,
      ExchangeRateEntity,
      CategoryEntity,
      HsCodeEntity,
      OrganizationEntity,
      OrganizationStatusHistoryEntity,
      VendorTargetCountryEntity,
      VendorBankAccountEntity,
      UserEntity,
      AuthSessionEntity,
      UserTokenEntity,
      UserSocialAccountEntity,
      BuyerProfileEntity,
      BuyerAddressEntity,
      RoleEntity,
      PermissionEntity,
      RolePermissionEntity,
      UserRoleEntity,
      AuditLogEntity,
    ],
    // No `migrations` array here: this DataSource (the one the running app
    // connects with) never runs migrations itself — that's done exclusively
    // via the CLI DataSource in src/config/typeorm.datasource.ts ("npm run
    // migration:run"). A dist/-relative glob here would be wrong in dev/test
    // (no build step has run) and is unused dead weight in prod.
  };
}
