import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MinLength,
} from 'class-validator';

// Admin vendor creation — supplies the vendorId every CreateProductDto
// needs (see products.service.ts). Mirrors Vendor's own nullable/required
// shape: companyName and status are DB NOT NULL, everything else is
// optional to match the entity's nullable columns.
export class CreateVendorDto {
  @ApiProperty({ example: 'Golden Spice Exports Pvt Ltd', maxLength: 250 })
  @IsString()
  @MinLength(1)
  @Length(1, 250)
  companyName!: string;

  @ApiPropertyOptional({ example: 'Golden Spice Exports', maxLength: 200 })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  displayName?: string;

  @ApiPropertyOptional({ example: 'contact@goldenspice.example' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+91-9876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: "Vendor's home/registered country.",
  })
  @IsOptional()
  @IsUUID()
  countryId?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}
