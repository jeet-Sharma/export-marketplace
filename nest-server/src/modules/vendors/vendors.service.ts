import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from '../../database/entities/vendor.entity.js';
import type { CreateVendorDto } from './dto/create-vendor.dto.js';
import {
  toVendorResponseDto,
  VendorResponseDto,
} from './dto/vendor-response.dto.js';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorRepository: Repository<Vendor>,
  ) {}

  // GET /admin/vendors (section 10.1) — supplier dropdown data for the
  // Add/Edit Product UI. Not filtered to ACTIVE-only here: Phase 1
  // doesn't specify whether an admin selector should exclude INACTIVE
  // vendors, and showing them (clearly labeled by status) is safer than
  // silently hiding a vendor an admin might need to re-activate.
  //
  // Returns { items: [...] }, matching section 10.1's example response
  // exactly — note this is unpaginated (no `pagination` block), unlike
  // the product list endpoints; the spec's own example for this
  // endpoint doesn't include one, and the vendor master list is
  // expected to be small enough not to need it in Phase 1.
  async findAll(): Promise<{ items: VendorResponseDto[] }> {
    const vendors = await this.vendorRepository.find({
      relations: ['country'],
      order: { companyName: 'ASC' },
    });
    return { items: vendors.map(toVendorResponseDto) };
  }

  // POST /admin/vendors. Supplies the vendorId CreateProductDto requires
  // (products.vendor_id is NOT NULL + FK-restricted) — without a vendor
  // to reference, product creation cannot succeed. countryId, if given,
  // must reference an existing Country row; letting that FK violation
  // surface as-is (rather than pre-checking existence here) matches how
  // ProductsService.create relies on the DB constraint for sourceCountryId.
  async create(dto: CreateVendorDto): Promise<VendorResponseDto> {
    const vendor = this.vendorRepository.create({
      companyName: dto.companyName,
      displayName: dto.displayName ?? null,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      countryId: dto.countryId ?? null,
      status: dto.status ?? 'ACTIVE',
    });
    const saved = await this.vendorRepository.save(vendor);

    const withCountry = await this.vendorRepository.findOne({
      where: { id: saved.id },
      relations: ['country'],
    });
    if (!withCountry) {
      throw new NotFoundException('Vendor not found after creation');
    }
    return toVendorResponseDto(withCountry);
  }
}
