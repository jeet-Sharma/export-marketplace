// Mirrors the nest-server Product entity fields returned by GET /admin/products
// (section 6.1). Only the fields the admin list actually serializes are typed
// here. `price` and `moq` are numeric-as-string from TypeORM — never Number()
// them (money precision; see marketplace-domain.md).
export type ApiProductStatus = "DRAFT" | "PUBLISHED";

export type ApiProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: ApiProductStatus;
  price: string | null;
  currencyCode: string | null;
  unit: string | null;
  moq: string | null;
  hsCode: string | null;
  exportEligibility: string | null;
  categoryId: string | null;
  vendorId: string;
  sourceCountryId: string | null;
  expiryDate?: string | null;
  createdAt: string;
  updatedAt: string;
};

// Mirrors a single tier of CreateProductDto.priceTiers (price-tier.dto.ts,
// API spec section 8). Not yet collected by the Add product modal's UI
// (the Figma "Quantity tiers" field is a single free-text/select input,
// not a tier builder) — kept here so the payload shape is ready when that
// UI exists, without inventing a tier array from a plain text string.
export type CreateProductPriceTier = {
  minQuantity: number;
  maxQuantity?: number | null;
  price: number;
  shippingEstimate?: number | null;
  dutiesEstimate?: number | null;
  taxesEstimate?: number | null;
  currencyCode: string;
};

// Mirrors CreateProductDto on the backend (API spec section 7/6.3).
// Every optional field here is nullable/TBD on the Product entity itself
// — see create-product.dto.ts's own comment on why these aren't required
// at the DTO level (publish-time validation happens server-side in
// ProductsService.assertPublishable instead).
export type CreateProductPayload = {
  name: string;
  description?: string;
  categoryId?: string;
  vendorId: string;
  status: ApiProductStatus;
  price?: number;
  currencyCode?: string;
  unit?: string;
  moq?: number;
  hsCode?: string;
  sourceCountryId?: string;
  targetCountryIds?: string[];
  exportEligibility?: string;
  countryRestrictions?: string;
  estimatedDeliveryText?: string;
  dutiesTaxesNote?: string;
  expiryDate?: string;
  priceTiers?: CreateProductPriceTier[];
};

export type ProductSort = "newest" | "price_asc" | "price_desc";

// Query params accepted by GET /admin/products.
export type AdminProductsQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: ProductSort;
  status?: ApiProductStatus;
};

// Shared paginated envelope (API spec section 13) used by every list endpoint.
export type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};
