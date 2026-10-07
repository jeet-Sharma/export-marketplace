import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from '../../database/entities/vendor.entity.js';

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
  findAll(): Promise<Vendor[]> {
    return this.vendorRepository.find({
      relations: ['country'],
      order: { companyName: 'ASC' },
    });
  }
}
