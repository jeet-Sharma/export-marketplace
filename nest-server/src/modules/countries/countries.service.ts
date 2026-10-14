import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Country } from '../../database/entities/country.entity.js';
import type { CreateCountryDto } from './dto/create-country.dto.js';

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
  ) {}

  // GET /countries (section 11) — public, active countries only for
  // source/target country selectors and filters.
  findAllActive(): Promise<Country[]> {
    return this.countryRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  // POST /admin/countries. Supplies the countryId that CreateProductDto's
  // sourceCountryId/targetCountryIds and CreateVendorDto's countryId all
  // reference via FK — same gap vendor/category creation filled for
  // vendorId/categoryId.
  //
  // iso2Code, iso3Code, and name are all UNIQUE at the DB level (see
  // InitPhase1Schema). Rather than pre-checking existence (a TOCTOU-prone
  // extra round trip), a violation is caught here and turned into a clean
  // 409 — same pattern as ProductsService.isUniqueViolation.
  async create(dto: CreateCountryDto): Promise<Country> {
    const country = this.countryRepository.create({
      iso2Code: dto.iso2Code.toUpperCase(),
      iso3Code: dto.iso3Code ? dto.iso3Code.toUpperCase() : null,
      name: dto.name,
      isActive: dto.isActive ?? true,
    });

    try {
      return await this.countryRepository.save(country);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'A country with a conflicting code or name already exists',
          errors: [
            {
              field: 'iso2Code',
              message: 'iso2Code, iso3Code, and name must each be unique',
            },
          ],
        });
      }
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const driverError = (
      error as QueryFailedError & { driverError?: { code?: string } }
    ).driverError;
    const code = driverError?.code ?? (error as { code?: string }).code;
    return code === '23505';
  }
}
