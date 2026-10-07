import { Country } from '../../database/entities/country.entity.js';
import { Product } from '../../database/entities/product.entity.js';
import { ProductPriceTier } from '../../database/entities/product-price-tier.entity.js';
import { ProductImageResponseDto } from '../../modules/products/dto/product-image-response.dto.js';

// View-model returned by the "full product detail" endpoints — section
// 6.2 (admin) and 12.2 (public). Both ProductsService.findOneForAdmin and
// PublicProductsService.findOneBySlug attach images/price tiers/target
// countries alongside the base Product row; this type makes that shape
// explicit instead of Object.assign-ing untyped extra keys onto a
// Product-typed value (which compiles, but the controller's declared
// return type then lies about what's actually serialized to the client).
//
// `images` uses ProductImageResponseDto (objectKey), matching section
// 12.2's example response — never the raw ProductImage entity, whose
// column is s3ObjectKey.
export interface ProductDetailDto extends Product {
  images: ProductImageResponseDto[];
  priceTiers: ProductPriceTier[];
  targetCountries: Country[];
}

export function toProductDetailDto(
  product: Product,
  images: ProductImageResponseDto[],
  priceTiers: ProductPriceTier[],
  targetCountries: Country[],
): ProductDetailDto {
  return { ...product, images, priceTiers, targetCountries };
}
