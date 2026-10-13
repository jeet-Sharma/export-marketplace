/**
 * Shapes returned by the live NestJS catalogue API (GET /products), as
 * documented in public-product-list-item.dto.ts on the backend. Kept
 * separate from `src/types/product.ts` (the UI-ready seed-data shape
 * ProductCard currently renders) — this is the raw API response, with
 * nested relations and numeric-as-string money fields exactly as the
 * backend returns them; mapping to the UI shape happens in
 * toProductCardProps (products.mapper.ts).
 */

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
}

export interface ApiVendor {
  id: string;
  companyName: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  /** Vendor's home/registered country ID — not expanded to a nested object by GET /products or /products/:slug, only the raw UUID is present. */
  countryId: string | null;
  status: "ACTIVE" | "INACTIVE";
}

export interface ApiCountry {
  id: string;
  name: string;
  iso2Code: string;
}

/** GET /products list item — see PublicProductListItemDto on the backend. */
export interface ApiProductListItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: ApiCategory | null;
  vendor: ApiVendor;
  status: "DRAFT" | "PUBLISHED";
  /** Numeric column returned as a string by the backend — never cast to Number for display math, only for formatting. */
  price: string | null;
  currencyCode: string | null;
  unit: string | null;
  moq: string | null;
  sourceCountry: ApiCountry | null;
  estimatedDeliveryText: string | null;
  primaryImageUrl: string | null;
  createdAt: string;
}

/** A single product image — see ProductImageResponseDto on the backend. */
export interface ApiProductImage {
  id: string;
  productId: string;
  objectKey: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

/**
 * A bulk price tier — see ProductPriceTier entity on the backend. All
 * numeric columns (minQuantity/maxQuantity/price/shippingEstimate/
 * dutiesEstimate/taxesEstimate) are returned as strings, same reasoning as
 * `price` on ApiProductListItem — never cast to Number for display math.
 */
export interface ApiProductPriceTier {
  id: string;
  productId: string;
  minQuantity: string;
  maxQuantity: string | null;
  price: string;
  /** Per-tier shipping estimate. Always render with an "estimate" label — never implied as a quoted/final figure. */
  shippingEstimate: string | null;
  /** Per-tier duties estimate. Always render with an "estimate" label. */
  dutiesEstimate: string | null;
  /** Per-tier taxes estimate. Always render with an "estimate" label. */
  taxesEstimate: string | null;
  currencyCode: string;
}

/**
 * GET /products/:slug response — see ProductDetailDto on the backend.
 * Extends the list item's fields (minus category/vendor/sourceCountry,
 * which the detail endpoint returns the same nested shape for) with the
 * full image gallery, bulk price tiers and target countries.
 */
export interface ApiProductDetail
  extends Omit<ApiProductListItem, "primaryImageUrl"> {
  images: ApiProductImage[];
  priceTiers: ApiProductPriceTier[];
  targetCountries: ApiCountry[];
  hsCode: string | null;
  exportEligibility: string | null;
  countryRestrictions: string | null;
  dutiesTaxesNote: string | null;
  publishedAt: string | null;
}

/** Shared pagination envelope — see PaginatedResponseDto on the backend. */
export interface ApiPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiPaginatedProducts {
  items: ApiProductListItem[];
  pagination: ApiPagination;
}

/** GET /products query params accepted by the backend (QueryPublicProductsDto). */
export interface GetProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  sourceCountryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minMoq?: number;
  maxMoq?: number;
  sort?: "newest" | "price_asc" | "price_desc";
}
