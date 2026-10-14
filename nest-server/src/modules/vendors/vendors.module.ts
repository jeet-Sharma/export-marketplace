import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from '../../database/entities/vendor.entity.js';
import { VendorsController } from './vendors.controller.js';
import { VendorsService } from './vendors.service.js';

// Does NOT import AuthModule — see the identical note in
// products.module.ts; JwtAuthGuard/PermissionsGuard don't need it.
@Module({
  imports: [TypeOrmModule.forFeature([Vendor])],
  controllers: [VendorsController],
  providers: [VendorsService],
})
export class VendorsModule {}
