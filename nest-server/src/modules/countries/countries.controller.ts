import { Controller, Get } from '@nestjs/common';
import { Country } from '../../database/entities/country.entity.js';
import { CountriesService } from './countries.service.js';

// GET /countries — section 11, public.
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  findAll(): Promise<Country[]> {
    return this.countriesService.findAllActive();
  }
}
