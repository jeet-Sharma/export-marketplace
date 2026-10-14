import type { GetProductsParams } from "../types/product-api.types";

/** Approved sort values — mirrors QueryPublicProductsDto's IsIn([...]) on the backend. */
const VALID_SORTS = new Set(["newest", "price_asc", "price_desc"]);

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNonNegativeNumber(value: string | null): number | undefined {
  if (value === null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

/**
 * Everything the product listing page reads from the URL, before the
 * category/country slug -> id resolution step (that needs the already-
 * fetched categories/countries lists, so it happens in the page component,
 * not here — see ProductsPageContent.tsx).
 */
export interface ProductListUrlState {
  page: number;
  pageSize: number;
  search?: string;
  categorySlug?: string;
  sourceCountryIso2?: string;
  minPrice?: number;
  maxPrice?: number;
  minMoq?: number;
  maxMoq?: number;
  sort: GetProductsParams["sort"];
}

const DEFAULT_PAGE_SIZE = 12;

/**
 * Parses the product listing's URL search params into typed, defaulted
 * values. Invalid/malformed values fall back to sane defaults rather than
 * being passed through to the API (e.g. a non-numeric `page` becomes `1`,
 * an unrecognized `sort` is dropped) — this is deliberately permissive
 * about bad URLs (a user editing the address bar by hand) rather than
 * erroring, since URL state is meant to be shareable and resilient.
 */
export function parseProductListUrlState(
  searchParams: URLSearchParams,
): ProductListUrlState {
  const sortParam = searchParams.get("sort");
  const sort = sortParam && VALID_SORTS.has(sortParam)
    ? (sortParam as GetProductsParams["sort"])
    : undefined;

  return {
    page: parsePositiveInt(searchParams.get("page"), 1),
    pageSize: parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
    search: searchParams.get("search") ?? undefined,
    categorySlug: searchParams.get("category") ?? undefined,
    sourceCountryIso2: searchParams.get("sourceCountry") ?? undefined,
    minPrice: parseNonNegativeNumber(searchParams.get("minPrice")),
    maxPrice: parseNonNegativeNumber(searchParams.get("maxPrice")),
    minMoq: parseNonNegativeNumber(searchParams.get("minMoq")),
    maxMoq: parseNonNegativeNumber(searchParams.get("maxMoq")),
    sort,
  };
}
