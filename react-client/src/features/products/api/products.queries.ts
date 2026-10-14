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
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<ApiPaginatedProducts[]>([]);

  const paramsKey = JSON.stringify(baseParams);
  const [prevParamsKey, setPrevParamsKey] = useState(paramsKey);

  if (paramsKey !== prevParamsKey) {
    setPrevParamsKey(paramsKey);
    setCurrentPage(1);
    setPages([]);
  }

  const queryResult = useGetProductsQuery({ ...baseParams, page: currentPage });
  const [prevData, setPrevData] = useState<ApiPaginatedProducts | undefined>(undefined);

  if (queryResult.data && queryResult.data !== prevData) {
    setPrevData(queryResult.data);
    const pageNum = queryResult.data.pagination.page;
    if (pageNum === 1) {
      setPages([queryResult.data]);
    } else {
      const next = [...pages];
      next[pageNum - 1] = queryResult.data;
      setPages(next.filter((p): p is ApiPaginatedProducts => p !== undefined));
    }
  }

  const totalPages =
    queryResult.data?.pagination.totalPages ??
    pages[pages.length - 1]?.pagination.totalPages ??
    1;

  const hasNextPage = currentPage < totalPages;
  const isLoading = queryResult.isLoading && pages.length === 0;
  const isFetchingNextPage = queryResult.isFetching && currentPage > 1;
  const isError = queryResult.isError && pages.length === 0;

  function fetchNextPage() {
    if (hasNextPage && !queryResult.isFetching) {
      setCurrentPage((p) => p + 1);
    }
  }

  function refetch() {
    if (currentPage === 1) {
      queryResult.refetch();
    } else {
      setPages([]);
      setCurrentPage(1);
    }
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


