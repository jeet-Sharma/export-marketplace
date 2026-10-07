import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../../database/entities/permission.entity.js';
import { RolePermission } from '../../database/entities/role-permission.entity.js';
import { Role } from '../../database/entities/role.entity.js';
import { UserRole } from '../../database/entities/user-role.entity.js';
import { User } from '../../database/entities/user.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission, UserRole, RolePermission]),
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
          expiresIn: configService.getOrThrow<string>('jwt.accessExpiresIn') as never,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PermissionsGuard],
  exports: [AuthService, PermissionsGuard],
})
export class AuthModule {}
