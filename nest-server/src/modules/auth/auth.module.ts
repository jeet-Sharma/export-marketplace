import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../../database/entities/permission.entity.js';
import { RolePermission } from '../../database/entities/role-permission.entity.js';
import { Role } from '../../database/entities/role.entity.js';
import { UserRole } from '../../database/entities/user-role.entity.js';
import { User } from '../../database/entities/user.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { LoginThrottlerGuard } from './guards/login-throttler.guard.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Permission,
      UserRole,
      RolePermission,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.accessSecret'),
        signOptions: {
          // jsonwebtoken@9's types narrow expiresIn to a `StringValue`
          // template-literal union (e.g. '15m') rather than a general
          // string. Our config value is always one of our own duration
          // strings (see jwt.config.ts), so this cast is safe.
          expiresIn: configService.getOrThrow<string>(
            'jwt.accessExpiresIn',
          ) as never,
        },
      }),
    }),
    // Rate limits POST /auth/login and POST /auth/refresh (via
    // @UseGuards(LoginThrottlerGuard) in auth.controller.ts) against
    // brute-force credential/token-guessing attempts and the excessive
    // CPU cost each attempt otherwise incurs (bcrypt.compare is
    // deliberately slow — see AuthService.validateCredentials's timing-
    // attack-mitigation comment, which also means unthrottled login
    // attempts are an easy CPU-exhaustion vector, not just a brute-force
    // one). Scoped to AuthModule, not registered globally — these two
    // unauthenticated endpoints are the ones a brute-force attempt would
    // target; everything else is already behind JwtAuthGuard/
    // PermissionsGuard. 10 requests per 60 seconds per IP is a starting
    // point generous enough for normal retry-after-typo use, tight
    // enough to make scripted guessing impractically slow; tune via
    // THROTTLE_LOGIN_LIMIT/THROTTLE_LOGIN_TTL_SECONDS if real traffic
    // shows otherwise.
    ThrottlerModule.forRoot([
      {
        name: 'login',
        ttl: (Number(process.env.THROTTLE_LOGIN_TTL_SECONDS) || 60) * 1000,
        limit: Number(process.env.THROTTLE_LOGIN_LIMIT) || 10,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    PermissionsGuard,
    LoginThrottlerGuard,
  ],
  exports: [AuthService, PermissionsGuard],
})
export class AuthModule {}
