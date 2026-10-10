import { apiClient } from "@/lib/api/client";
import type {
  ApiPaginatedProducts,
  GetProductsParams,
} from "../types/product-api.types";

/** GET /products — public marketplace catalogue (section 12.1 of the API spec). */
export async function getProducts(
  params: GetProductsParams = {},
): Promise<ApiPaginatedProducts> {
  const { data } = await apiClient.get<ApiPaginatedProducts>("/products", {
    params,
  });
  return data;
}
