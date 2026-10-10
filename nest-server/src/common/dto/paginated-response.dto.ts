// Shared success-collection envelope, per Phase-1-API-Specification-v0.1
// section 13. Used by every paginated list endpoint (admin products,
// public catalogue, etc.) so clients get one consistent shape.
export interface PaginatedResponseDto<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}
