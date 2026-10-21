"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { ProductSort } from "./productTypes";

const VALID_SORTS: readonly ProductSort[] = [
  "newest",
  "price_asc",
  "price_desc",
];

const PAGE_SIZE = 10;

export type ProductQueryState = {
  page: number;
  pageSize: number;
  search: string;
  sort: ProductSort;
  status: "all" | "PUBLISHED" | "DRAFT";
  categoryId?: string;
};

/**
 * Product list filter/sort/pagination live in the URL (frontend-rules #35/#36)
 * so refresh/back/share stay predictable and there's one source of truth. This
 * hook reads the current params and returns setters that patch the query string
 * (resetting to page 1 when the filter changes, so you never land on an empty
 * page that no longer exists).
 */
export function useProductQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state: ProductQueryState = useMemo(() => {
    const rawSort = searchParams.get("sort");
    const rawPage = Number(searchParams.get("page"));
    const rawStatus = searchParams.get("status");
    const validStatus =
      rawStatus === "PUBLISHED" || rawStatus === "DRAFT" ? rawStatus : "all";

    return {
      page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1,
      pageSize: PAGE_SIZE,
      search: searchParams.get("search") ?? "",
      sort: VALID_SORTS.includes(rawSort as ProductSort)
        ? (rawSort as ProductSort)
        : "newest",
      status: validStatus,
      categoryId: searchParams.get("categoryId") ?? undefined,
    };
  }, [searchParams]);

  const patch = useCallback(
    (updates: Record<string, string | number | null>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      if (resetPage && !("page" in updates)) {
        params.delete("page");
      }
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  const setSearch = useCallback(
    (value: string) => patch({ search: value }),
    [patch],
  );
  const setSort = useCallback(
    (value: ProductSort) => patch({ sort: value }),
    [patch],
  );
  const setPage = useCallback(
    (value: number) => patch({ page: value }, false),
    [patch],
  );
  const setStatus = useCallback(
    (value: "all" | "PUBLISHED" | "DRAFT") => patch({ status: value }),
    [patch],
  );
  const setCategoryId = useCallback(
    (value: string | null) => patch({ categoryId: value }),
    [patch],
  );

  return { state, setSearch, setSort, setPage, setStatus, setCategoryId };
}
