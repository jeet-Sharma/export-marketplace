import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getProductBySlug, getProducts } from "./products.api";
import type { GetProductsParams } from "../types/product-api.types";

/** Query key factory, so invalidation/refetch call-sites never hand-roll the array shape. */
export const productsQueryKeys = {
  all: ["products"] as const,
  list: (params: GetProductsParams) =>
    [...productsQueryKeys.all, "list", params] as const,
  infiniteList: (params: Omit<GetProductsParams, "page">) =>
    [...productsQueryKeys.all, "infinite-list", params] as const,
  detail: (slug: string) => [...productsQueryKeys.all, "detail", slug] as const,
};

/** Fetches the public product catalogue (GET /products) via TanStack Query. */
export function useProductsQuery(params: GetProductsParams = {}) {
  return useQuery({
    queryKey: productsQueryKeys.list(params),
    queryFn: () => getProducts(params),
  });
}

/**
 * "Load more"-style pagination over GET /products via TanStack Query's
 * useInfiniteQuery. Pages are 1-indexed to match the backend's `page` param.
 * `getNextPageParam` returns `undefined` once the last page has been
 * fetched (current page >= pagination.totalPages), which is what
 * `hasNextPage` reflects — callers use that to hide the "Load more" button
 * instead of tracking total/loaded counts by hand.
 */
export function useProductsInfiniteQuery(
  params: Omit<GetProductsParams, "page"> = {},
) {
  return useInfiniteQuery({
    queryKey: productsQueryKeys.infiniteList(params),
    queryFn: ({ pageParam }) => getProducts({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

/**
 * Fetches a single product's full detail (GET /products/:slug) for the
 * product detail page's client-side needs (used by Server Component
 * fetching for the initial render — see app/(main)/products/[slug]/page.tsx
 * — this hook exists for any future client-side refetch/interaction on
 * that page, matching the project's existing RTK/TanStack Query pattern).
 * `enabled: Boolean(slug)` avoids firing with an empty slug.
 */
export function useProductQuery(slug: string) {
  return useQuery({
    queryKey: productsQueryKeys.detail(slug),
    queryFn: () => getProductBySlug(slug),
    enabled: Boolean(slug),
  });
}
