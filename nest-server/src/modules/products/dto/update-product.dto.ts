import { ApiProperty } from '@nestjs/swagger';
import { PartialType, OmitType } from '@nestjs/swagger';
import { IsString, IsUUID, Length, MinLength, ValidateIf } from 'class-validator';
import { CreateProductDto } from './create-product.dto.js';

// PATCH /admin/products/:id (section 6.4). Status transitions are
// deliberately excluded — they only happen via the dedicated
// /publish and /unpublish endpoints (sections 6.5/6.6), not a generic
// field update, so a PATCH can't silently flip DRAFT<->PUBLISHED.
//
// name and vendorId are re-declared below (rather than left as whatever
// PartialType produces) because PartialType wraps every field in
// @IsOptional(), and @IsOptional() treats BOTH `undefined` (field omitted
// — the intended PATCH semantics) AND explicit `null` as "skip all other
// validators". That means `{"name": null}` or `{"vendorId": null}` would
// otherwise pass DTO validation and reach ProductsService.update, which
// writes `product.name = null`/`product.vendorId = null` straight onto
// NOT NULL columns — surfacing as a raw DB constraint error (or worse, a
// 500) instead of a clean 400. @ValidateIf here narrows "skip validation"
// to just `undefined`, so an explicitly-null value for these two
// mandatory fields still runs — and fails — the same validators
// CreateProductDto uses.
class UpdateProductDtoBase extends PartialType(
  OmitType(CreateProductDto, ['status', 'name', 'vendorId'] as const),
) {}

export class UpdateProductDto extends UpdateProductDtoBase {
  @ApiProperty({
    example: 'Organic Turmeric Powder',
    maxLength: 250,
    required: false,
    description: 'Omit to leave unchanged. Explicit null is rejected.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MinLength(1)
  @Length(1, 250)
  name?: string;

  @ApiProperty({
    format: 'uuid',
    required: false,
    description:
      'Selected supplier/vendor. Omit to leave unchanged. Explicit null is rejected.',
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID()
  vendorId?: string;
}
