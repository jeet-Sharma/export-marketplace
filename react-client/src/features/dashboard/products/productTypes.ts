// Mirrors the nest-server Product entity fields returned by GET /admin/products
// (section 6.1). Only the fields the admin list actually serializes are typed
// here. `price` and `moq` are numeric-as-string from TypeORM — never Number()
// them (money precision; see marketplace-domain.md).
export type ApiProductStatus = "DRAFT" | "PUBLISHED";

export type ProductImageResponse = {
  id: string;
  objectKey: string;
  url: string;
  sortOrder: number;
  altText?: string | null;
  createdAt?: string;
};

export type ProductPriceTier = {
  id: string;
  minQuantity: string;
  maxQuantity: string | null;
  unitPrice: string;
};

export type ProductCountryRef = {
  id: string;
  iso2Code: string;
  iso3Code: string;
  name: string;
};

export type ApiProductCategory = {
  id: string;
  name: string;
  slug: string;
};

export type ApiVendor = {
  id: string;
  companyName: string;
  displayName: string | null;
  status: string;
  country?: {
    id: string;
    code: string;
    name: string;
  } | null;
};

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
  countryRestrictions?: string | null;
  estimatedDeliveryText?: string | null;
  dutiesTaxesNote?: string | null;
  categoryId: string | null;
  category?: ApiProductCategory | null;
  vendorId: string;
  vendor?: ApiVendor | null;
  sourceCountryId: string | null;
  sourceCountry?: ProductCountryRef | null;
  targetCountries?: ProductCountryRef[];
  priceTiers?: ProductPriceTier[];
  images?: ProductImageResponse[];
  expiryDate?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductSort = "newest" | "price_asc" | "price_desc";

// Query params accepted by GET /admin/products.
export type AdminProductsQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: ProductSort;
  status?: ApiProductStatus;
  categoryId?: string;
  vendorId?: string;
};

// Input payload for POST /admin/products
export type CreateProductInput = {
  name: string;
  vendorId: string;
  status: ApiProductStatus;
  description?: string;
  categoryId?: string;
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
};

// Input payload for PATCH /admin/products/:id
export type UpdateProductInput = Partial<Omit<CreateProductInput, "status">>;

export type UploadUrlResponse = {
  uploadUrl: string;
  objectKey: string;
  key?: string;
  expiresAt?: string;
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
