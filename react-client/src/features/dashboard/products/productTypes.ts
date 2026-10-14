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
