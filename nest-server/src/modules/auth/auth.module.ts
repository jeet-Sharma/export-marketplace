import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AuthConfig } from '../../config/auth.config.js';
import { AuthSessionEntity } from '../identity/entities/auth-session.entity.js';
import { BuyerProfileEntity } from '../identity/entities/buyer-profile.entity.js';
import { RoleEntity } from '../identity/entities/role.entity.js';
import { UserRoleEntity } from '../identity/entities/user-role.entity.js';
import { UserTokenEntity } from '../identity/entities/user-token.entity.js';
import { UserEntity } from '../identity/entities/user.entity.js';
import { EmailModule } from '../email/email.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

/**
 * Buyer registration, email verification, resend, login, and the
 * JwtAuthGuard/@CurrentUser() request-auth primitives. Buyer profile/address
 * APIs (which will consume this guard) are a separate module, not built here.
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
  imports: [
    EmailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const auth = configService.get<AuthConfig>('auth')!;
        return {
          secret: auth.accessSecret,
          signOptions: { expiresIn: auth.accessTokenTtlSeconds },
        };
      },
    }),
    TypeOrmModule.forFeature([UserEntity, BuyerProfileEntity, UserRoleEntity, UserTokenEntity, RoleEntity, AuthSessionEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  // Export JwtAuthGuard + JwtModule so feature modules (e.g. the upcoming
  // BuyerModule) can protect their routes with @UseGuards(JwtAuthGuard)
  // without re-configuring JWT verification.
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule { }
