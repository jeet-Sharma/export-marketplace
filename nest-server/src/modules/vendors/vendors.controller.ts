import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { CreateVendorDto } from './dto/create-vendor.dto.js';
import { VendorResponseDto } from './dto/vendor-response.dto.js';
import { VendorsService } from './vendors.service.js';

// GET/POST /admin/vendors — section 10.1 (list), plus vendor creation
// (vendor.create) so admins can supply the vendorId CreateProductDto
// requires without going through a DB migration/seed.
@ApiTags('Vendors')
@ApiBearerAuth('access-token')
@Controller('admin/vendors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @ApiOperation({ summary: 'List vendors (section 10.1)' })
  @Get()
  @RequirePermissions('vendor.view')
  findAll(): Promise<{ items: VendorResponseDto[] }> {
    return this.vendorsService.findAll();
  }

  @ApiOperation({ summary: 'Create a vendor/supplier' })
  @ApiOkResponse({ type: VendorResponseDto })
  @Post()
  @RequirePermissions('vendor.create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateVendorDto): Promise<VendorResponseDto> {
    return this.vendorsService.create(dto);
  }
}
