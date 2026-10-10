import { ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../../../database/entities/product.entity.js';

// GET /products (section 12.1) list item. Extends the base Product shape
// with a single additive field — primaryImageUrl — so the catalogue grid
// can render a thumbnail without a second round-trip per product. Previously
// this endpoint returned bare Product rows with no image data at all (see
// Qodo review Bug #13); the full `images[]` array (as returned by the
// detail endpoint) is deliberately NOT duplicated here, since a list view
// only ever needs one representative image per product, and resolving
// every image's display URL for every row on a paginated grid would be
// wasteful.
export interface PublicProductListItemDto extends Product {
  primaryImageUrl: string | null;
}

export function toPublicProductListItemDto(
  product: Product,
  primaryImageUrl: string | null,
): PublicProductListItemDto {
  return { ...product, primaryImageUrl };
}

// Swagger documents the extra field inline on the controller response
// instead of a decorated class, matching ProductDetailDto's own approach
// (see that file's comment) — Product is a TypeORM entity, not something
// @ApiProperty can be added to without a larger refactor.
export class PublicProductListItemExtraFieldsDto {
  @ApiPropertyOptional({
    nullable: true,
    description:
      "Display URL for the product's primary image, or null if it has none.",
  })
  primaryImageUrl?: string | null;
}
