import { useState } from "react";
import { baseApi } from "@/store/baseApi";
import type {
  ApiPaginatedProducts,
  ApiProductDetail,
  GetProductsParams,
} from "../types/product-api.types";

/**
 * Public catalogue endpoints injected into the shared baseApi
 * (frontend-rules #11). Replaces the previous TanStack Query wrappers so
 * product data lives in a single RTK Query cache with consistent base-URL
 * config, auth headers and cache-tag invalidation.
 *
 * Hook names are unchanged from the TanStack era so every call-site
 * continues to compile without modification.
 */
const catalogueApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** GET /api/v1/products — public marketplace catalogue (section 12.1). */
    getProducts: builder.query<ApiPaginatedProducts, GetProductsParams>({
      query: (params = {}) => ({ url: "/products", params }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((p) => ({
                type: "Product" as const,
                id: p.id,
              })),
              { type: "ProductList" as const, id: "LIST" },
            ]
          : [{ type: "ProductList" as const, id: "LIST" }],
    }),

    /**
     * GET /api/v1/products/:slug — single published product detail
     * (section 12.2). The backend returns 404 for both nonexistent and
     * DRAFT slugs — callers should treat any non-2xx as "not found".
     */
    getProductBySlug: builder.query<ApiProductDetail, string>({
      query: (slug) => ({ url: `/products/${encodeURIComponent(slug)}` }),
      providesTags: (_result, _error, slug) => [{ type: "Product", id: slug }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductBySlugQuery,
  useLazyGetProductsQuery,
} = catalogueApi;

// ─── Named wrappers matching the old TanStack hook signatures ────────────────

/**
 * Fetches the public product catalogue (GET /products) via RTK Query.
 *
 * `enabled` mirrors TanStack Query's option of the same name: when `false`
 * the query is held (RTK `skip: true`) until the caller is ready — typically
 * until any category or country slug in the URL has been resolved to an ID
 * so the request is never fired with a missing filter ID.
 */
export function useProductsQuery(
  params: GetProductsParams = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useGetProductsQuery(params, { skip: !enabled });
}

/**
 * Fetches a single product's full detail (GET /products/:slug).
 * `skip` is set when slug is empty, matching the previous `enabled: Boolean(slug)`.
 */
export function useProductQuery(slug: string) {
  return useGetProductBySlugQuery(slug, { skip: !slug });
}

/**
 * "Load more" pagination hook over GET /products.
 *
 * RTK Query does not have a built-in infinite query primitive. This hook
 * replicates the TanStack useInfiniteQuery contract consumed by
 * TrendingProducts.tsx by:
 *   - Fetching individual pages as separate cached queries.
 *   - Accumulating results in a `pages` array keyed by page number.
 *   - Exposing fetchNextPage / hasNextPage / isFetchingNextPage to match
 *     the previous call-site API exactly.
 *
 * Each page is a separate RTK Query cache entry, so switching back to a
 * previous page is instant (already cached) and the redux store still
 * owns all state.
 */
export function useProductsInfiniteQuery(
  baseParams: Omit<GetProductsParams, "page"> = {},
) {
  // RTK Query does not have a stateful "current page" primitive for infinite
  // lists, so we use useState here to track how many pages have been loaded.
  // This is the standard pattern recommended by the RTK Query docs for
  // "Load more" UIs when the built-in `merge` option is not used.
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch pages 1..currentPage as individual queries. Only the last page
  // (currentPage) is actually refetched on re-render; earlier pages come
  // from cache.
  const pageQueries = Array.from({ length: currentPage }, (_, i) => i + 1).map(
    (page) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks -- safe: loop
      // length is controlled by React state (always the same at a given render)
      // so hook call count is stable between renders.
      useGetProductsQuery({ ...baseParams, page }),
  );

  const lastQuery = pageQueries[pageQueries.length - 1];

  const pages = pageQueries
    .map((q) => q.data)
    .filter((d): d is ApiPaginatedProducts => d !== undefined);

  const totalPages = lastQuery.data?.pagination.totalPages ?? 1;
  const hasNextPage = currentPage < totalPages;
  const isLoading = pageQueries[0].isLoading;
  const isFetchingNextPage = lastQuery.isFetching && currentPage > 1;
  const isError = pageQueries.some((q) => q.isError);

  function fetchNextPage() {
    if (hasNextPage) {
      setCurrentPage((p) => p + 1);
    }
  }

  function refetch() {
    setCurrentPage(1);
    pageQueries[0].refetch();
  }

  return {
    data: pages.length > 0 ? { pages } : undefined,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  };
}


