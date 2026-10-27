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
  overrideExisting: true,
  endpoints: (builder) => ({
    /** GET /api/v1/products — public marketplace catalogue (section 12.1). */
    getProducts: builder.query<ApiPaginatedProducts, GetProductsParams>({
      // FIX 1: Strip undefined values before RTK serialises params.
      // fetchBaseQuery passes params to URLSearchParams, which calls String()
      // on every value — String(undefined) = "undefined". The backend's
      // @IsUUID() and @IsNumber() validators reject those strings with a 400,
      // breaking the product list after createProduct's invalidatesTags fires
      // a refetch with undefined optional fields in the params object.
      query: (params = {}) => ({
        url: "/products",
        params: Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined),
        ),
      }),
      // FIX 2: Use "PublicProductList" instead of "ProductList".
      // Both tags previously shared the same name, so createProduct's
      // invalidatesTags: [{ type: "ProductList", id: "LIST" }] was also
      // invalidating this public endpoint and triggering a refetch that sent
      // "undefined" strings as query params (see FIX 1 above).
      // Now only admin mutations touch "ProductList"; the public catalogue
      // has its own isolated tag and is not affected by admin writes.
      providesTags: (result) =>
        result
          ? [
              ...result.items.map((p) => ({
                type: "PublicProductList" as const,
                id: p.id,
              })),
              { type: "PublicProductList" as const, id: "LIST" },
            ]
          : [{ type: "PublicProductList" as const, id: "LIST" }],
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<ApiPaginatedProducts[]>([]);

  const paramsKey = JSON.stringify(baseParams);
  const [prevParamsKey, setPrevParamsKey] = useState(paramsKey);

  // When baseParams change (e.g. a filter is applied) reset the accumulated
  // pages immediately so the next render starts from a clean slate, rather
  // than briefly displaying stale items from the previous filter set.
  if (paramsKey !== prevParamsKey) {
    setPrevParamsKey(paramsKey);
    setCurrentPage(1);
    setPages([]);
  }

  const queryResult = useGetProductsQuery({ ...baseParams, page: currentPage });
  const [prevData, setPrevData] = useState<ApiPaginatedProducts | undefined>(undefined);

  // Accumulate pages into local state. When RTK Query re-fetches page 1 due
  // to cache invalidation (e.g. after createProduct) the returned data is a
  // fresh page 1 — replace the entire pages array rather than merging, so
  // the list reflects the server's current state instead of a stale splice.
  if (queryResult.data && queryResult.data !== prevData) {
    setPrevData(queryResult.data);
    const pageNum = queryResult.data.pagination.page;
    if (pageNum === 1) {
      // Overwrite everything — handles both the initial load and a
      // cache-invalidation refetch (where we always land back on page 1).
      setPages([queryResult.data]);
    } else {
      const next = [...pages];
      next[pageNum - 1] = queryResult.data;
      setPages(next.filter((p): p is ApiPaginatedProducts => p !== undefined));
    }
  }

  // When RTK Query clears a cache entry (e.g. tag invalidation) queryResult
  // briefly has no data while the refetch is in flight. If we still have
  // accumulated pages, treat the component as "re-fetching page 1" rather
  // than "no results" — this prevents the "0 of 0" flash that would
  // otherwise appear while the fresh page-1 response is in flight.
  const effectivePages =
    queryResult.data === undefined && pages.length > 0 && queryResult.isFetching
      ? []   // clear stale pages so the skeleton shows instead of stale cards
      : pages;

  const totalPages =
    queryResult.data?.pagination.totalPages ??
    effectivePages[effectivePages.length - 1]?.pagination.totalPages ??
    1;

  const hasNextPage = currentPage < totalPages;
  // isLoading: no accumulated pages AND the query is loading for the first time
  const isLoading = queryResult.isLoading && effectivePages.length === 0;
  // isFetching on a subsequent page (not a background revalidation of page 1)
  const isFetchingNextPage = queryResult.isFetching && currentPage > 1;
  // isError: only surface an error when there are no pages to show as fallback
  const isError = queryResult.isError && effectivePages.length === 0;

  function fetchNextPage() {
    if (hasNextPage && !queryResult.isFetching) {
      setCurrentPage((p) => p + 1);
    }
  }

  function refetch() {
    // Always go back to page 1 and clear accumulated state so the fresh
    // response fully replaces whatever was there before.
    setPages([]);
    setPrevData(undefined);
    setCurrentPage(1);
    queryResult.refetch();
  }

  return {
    data: effectivePages.length > 0 ? { pages: effectivePages } : undefined,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  };
}
