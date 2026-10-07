import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Country } from '../../database/entities/country.entity.js';

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
}
