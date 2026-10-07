import { Country } from '../../database/entities/country.entity.js';
import { Product } from '../../database/entities/product.entity.js';
import { ProductPriceTier } from '../../database/entities/product-price-tier.entity.js';

// View-model returned by the "full product detail" endpoints — section
// 6.2 (admin) and 12.2 (public). Both ProductsService.findOneForAdmin and
// PublicProductsService.findOneBySlug attach price tiers and target
// countries alongside the base Product row; this type makes that shape
// explicit instead of Object.assign-ing untyped extra keys onto a
// Product-typed value (which compiles, but the controller's declared
// return type then lies about what's actually serialized to the client).
export interface ProductDetailDto extends Product {
  priceTiers: ProductPriceTier[];
  targetCountries: Country[];
}

export function toProductDetailDto(
  product: Product,
  priceTiers: ProductPriceTier[],
  targetCountries: Country[],
): ProductDetailDto {
  return { ...product, priceTiers, targetCountries };
}
