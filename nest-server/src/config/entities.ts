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

/**
 * The single, authoritative list of TypeORM entities.
 *
 * This file deliberately imports ONLY entity classes — no @nestjs/config or
 * any other framework code. Both consumers import from here:
 *   - db.config.ts (the running Nest app's DataSource)
 *   - typeorm.datasource.ts (the standalone migration CLI)
 * The CLI runs outside Nest, so it must not transitively pull in
 * @nestjs/config; keeping this list framework-free is what lets the app and
 * the CLI share one source of truth without breaking `npm run migration:*`.
 * Add a new entity here once and both consumers pick it up.
 */
export const ENTITIES = [
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
];
