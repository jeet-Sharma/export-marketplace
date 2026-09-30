import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogEntity } from './entities/audit-log.entity.js';
import { AuthSessionEntity } from './entities/auth-session.entity.js';
import { BuyerAddressEntity } from './entities/buyer-address.entity.js';
import { BuyerProfileEntity } from './entities/buyer-profile.entity.js';
import { OrganizationStatusHistoryEntity } from './entities/organization-status-history.entity.js';
import { OrganizationEntity } from './entities/organization.entity.js';
import { PermissionEntity } from './entities/permission.entity.js';
import { RolePermissionEntity } from './entities/role-permission.entity.js';
import { RoleEntity } from './entities/role.entity.js';
import { UserRoleEntity } from './entities/user-role.entity.js';
import { UserSocialAccountEntity } from './entities/user-social-account.entity.js';
import { UserTokenEntity } from './entities/user-token.entity.js';
import { UserEntity } from './entities/user.entity.js';
import { VendorBankAccountEntity } from './entities/vendor-bank-account.entity.js';
import { VendorTargetCountryEntity } from './entities/vendor-target-country.entity.js';

/**
 * PART 2 — Companies, People and Access (Data_Modeling_Complete.md, Document 6 v3).
 *
 * Registers the 14 registration/access-model entities as TypeORM entities:
 * organization, organization_status_history, vendor_target_country,
 * vendor_bank_account, users, auth_session, user_token,
 * user_social_account, buyer_profile, buyer_address, role, permission,
 * role_permission, user_role, audit_log.
 *
 * No controller or service yet — this is a database-schema-only pass (see
 * the CreateCompaniesPeopleAccess migration for the actual schema). No
 * authentication, authorization guards, or bootstrap/seed data (no
 * PLATFORM organization row, no SUPER_ADMIN user) are implemented here.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
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
    ]),
  ],
  exports: [TypeOrmModule],
})
export class IdentityModule {}
