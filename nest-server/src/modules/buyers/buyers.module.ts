import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuyerProfileEntity } from '../identity/entities/buyer-profile.entity.js';
import { UserEntity } from '../identity/entities/user.entity.js';
import { AuthModule } from '../auth/auth.module.js';
import { BuyersController } from './buyers.controller.js';
import { BuyersService } from './buyers.service.js';

/**
 * Buyer self-service profile (GET/PATCH /buyers/me).
 *
 * Imports AuthModule for JwtAuthGuard (+ its JwtModule config) so the routes
 * can be protected without re-declaring JWT verification. Entities are
 * registered with forFeature because BuyersService reaches them through the
 * DataSource; Nest scopes forFeature per module, so this module needs its own
 * registration even though other modules register the same entities.
 */
@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([UserEntity, BuyerProfileEntity])],
  controllers: [BuyersController],
  providers: [BuyersService],
})
export class BuyersModule {}
