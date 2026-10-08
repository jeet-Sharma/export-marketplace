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
import { Country } from '../../database/entities/country.entity.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { CountriesService } from './countries.service.js';
import { CreateCountryDto } from './dto/create-country.dto.js';

@ApiTags('Countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  // GET /countries — section 11, public.
  @ApiOperation({ summary: 'List active countries (section 11)' })
  @Get()
  findAll(): Promise<Country[]> {
    return this.countriesService.findAllActive();
  }

  // POST /countries — admin-only (country.create), guarded per-route so
  // the public GET above stays unauthenticated. Same pattern as
  // CategoriesController's create route.
  @ApiOperation({ summary: 'Create a country' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: Country })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  @RequirePermissions('country.create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCountryDto): Promise<Country> {
    return this.countriesService.create(dto);
  }
}
