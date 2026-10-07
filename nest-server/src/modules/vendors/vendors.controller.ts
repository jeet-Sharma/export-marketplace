import { Controller, Get, UseGuards } from '@nestjs/common';
import { Vendor } from '../../database/entities/vendor.entity.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { VendorsService } from './vendors.service.js';

// GET /admin/vendors — section 10.1, requires vendor.view.
@Controller('admin/vendors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @RequirePermissions('vendor.view')
  findAll(): Promise<Vendor[]> {
    return this.vendorsService.findAll();
  }
}
