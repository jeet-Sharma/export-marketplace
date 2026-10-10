import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

// Admin country creation — supplies the countryId CreateProductDto's
// sourceCountryId/targetCountryIds and CreateVendorDto's countryId all
// reference. Mirrors Country's own column shape: iso2Code and name are DB
// NOT NULL + UNIQUE, iso3Code is nullable + UNIQUE, isActive defaults to
// true to match how the seeded reference-data migration creates countries.
export class CreateCountryDto {
  @ApiProperty({
    example: 'IN',
    minLength: 2,
    maxLength: 2,
    description: 'ISO 3166-1 alpha-2 code.',
  })
  @IsString()
  @Length(2, 2)
  iso2Code!: string;

  @ApiPropertyOptional({
    example: 'IND',
    minLength: 3,
    maxLength: 3,
    description: 'ISO 3166-1 alpha-3 code.',
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  iso3Code?: string;

  @ApiProperty({ example: 'India', maxLength: 150 })
  @IsString()
  @Length(1, 150)
  name!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
