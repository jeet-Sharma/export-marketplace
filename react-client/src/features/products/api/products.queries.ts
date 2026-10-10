import { useQuery } from "@tanstack/react-query";
import { getProducts } from "./products.api";
import type { GetProductsParams } from "../types/product-api.types";

/** Query key factory, so invalidation/refetch call-sites never hand-roll the array shape. */
export const productsQueryKeys = {
  all: ["products"] as const,
  list: (params: GetProductsParams) =>
    [...productsQueryKeys.all, "list", params] as const,
};

/** Fetches the public product catalogue (GET /products) via TanStack Query. */
export function useProductsQuery(params: GetProductsParams = {}) {
  return useQuery({
    queryKey: productsQueryKeys.list(params),
    queryFn: () => getProducts(params),
  });
}
