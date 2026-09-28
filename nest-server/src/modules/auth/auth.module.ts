import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyerProfileEntity } from '../identity/entities/buyer-profile.entity.js';
import { RoleEntity } from '../identity/entities/role.entity.js';
import { UserRoleEntity } from '../identity/entities/user-role.entity.js';
import { UserTokenEntity } from '../identity/entities/user-token.entity.js';
import { UserEntity } from '../identity/entities/user.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

/**
 * Buyer registration only (POST /auth/register), built one endpoint at a
 * time per the current task. Deliberately NOT included in this pass, to be
 * added alongside the endpoints that actually need them:
 *   - POST /auth/verify-email (consumes the user_token row this module
 *     already creates)
 *   - POST /auth/login, auth_session, JWT issuance
 *   - JwtAuthGuard / @CurrentUser() decorator
 *   - BuyerModule (GET/PATCH /buyers/me, address CRUD) — needs the guard
 *     above to exist first
 *
 * TypeOrmModule.forFeature registers the entities this module's service
 * touches directly. UserEntity/BuyerProfileEntity/UserRoleEntity/
 * UserTokenEntity are already registered globally via IdentityModule
 * elsewhere, but Nest scopes forFeature per module — AuthModule needs its
 * own registration to inject their repositories (used here via
 * DataSource.transaction's EntityManager, not @InjectRepository, but the
 * entities must still be known to this module's TypeOrmModule context).
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, BuyerProfileEntity, UserRoleEntity, UserTokenEntity, RoleEntity])],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
