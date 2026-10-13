import { apiClient } from "@/lib/api/client";
import type {
  ApiPaginatedProducts,
  ApiProductDetail,
  GetProductsParams,
} from "../types/product-api.types";

/** GET /api/v1/products — public marketplace catalogue (section 12.1 of the API spec). */
export async function getProducts(
  params: GetProductsParams = {},
): Promise<ApiPaginatedProducts> {
  const { data } = await apiClient.get<ApiPaginatedProducts>("/products", {
    params,
  });
  return data;
}

/**
 * GET /api/v1/products/:slug — single published product's full detail (section
 * 12.2). The backend returns a plain 404 for a nonexistent slug AND for a
 * DRAFT/unpublished product — both cases are indistinguishable here by
 * design (prevents leaking draft existence), so callers should treat any
 * non-2xx as "not found", not try to tell the two apart.
 */
export async function getProductBySlug(slug: string): Promise<ApiProductDetail> {
  const { data } = await apiClient.get<ApiProductDetail>(
    `/products/${encodeURIComponent(slug)}`,
  );
  return data;
}
