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
