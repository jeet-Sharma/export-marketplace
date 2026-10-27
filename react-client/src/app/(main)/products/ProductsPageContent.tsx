"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AssuranceBar } from "@/components/layout/AssuranceBar";
import { CategoryIntro } from "@/components/products/CategoryIntro";
import { ProductFilters, type ProductFiltersValue } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductsPagination } from "@/components/products/ProductsPagination";
import { ProductsToolbar } from "@/components/products/ProductsToolbar";
import { Button } from "@/components/ui/Button";
import { TradeAndExport } from "@/components/home/TradeAndExport";
import { routes } from "@/config/routes";
import { useCategoriesQuery } from "@/features/categories/api/categories.queries";
import { useCountriesQuery } from "@/features/countries/api/countries.queries";
import { useProductsQuery } from "@/features/products/api/products.queries";
import { toProductCardProps } from "@/features/products/api/products.mapper";
import { parseProductListUrlState } from "@/features/products/lib/parse-product-filters";
import type { GetProductsParams } from "@/features/products/types/product-api.types";

/** Skeleton placeholder shown while the catalogue grid is loading. */
function ProductGridSkeleton() {
  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          aria-hidden
          className="skeleton-shimmer h-[278px] rounded-[10px] border border-black/[0.09]"
        />
      ))}
    </div>
  );
}

/**
 * Product listing page content. URL searchParams are the single source of
 * truth for every filter/sort/page value (see frontend-rules.md's state
 * table — "Product filter state → URL state") — nothing here is mirrored
 * into component state except the MOQ inputs' in-progress typed value
 * (ProductFilters' own local useState, committed to the URL only on
 * "Apply MOQ"). Category/country slugs in the URL are resolved to the IDs
 * the backend's GET /products actually filters by, using the already-
 * fetched categories/countries lists — no new backend endpoint is needed
 * for this resolution.
 */
export function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlState = parseProductListUrlState(searchParams);

  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useCategoriesQuery();
  const { data: countries } = useCountriesQuery();

  const selectedCategory = urlState.categorySlug
    ? categories?.find((c) => c.slug === urlState.categorySlug)
    : undefined;
  const selectedCountry = urlState.sourceCountryIso2
    ? countries?.find((c) => c.iso2Code === urlState.sourceCountryIso2)
    : undefined;

  // A category slug was given in the URL but didn't match any real
  // category once the list loaded — treat the same as "category not
  // found" rather than silently falling back to "all products".
  const hasInvalidCategory =
    Boolean(urlState.categorySlug) && Boolean(categories) && !selectedCategory;

  // A country ISO code was given in the URL but didn't match any real
  // country once the list loaded — treat the same as "country not
  // found" rather than silently falling back to "all countries".
  const hasInvalidCountry =
    Boolean(urlState.sourceCountryIso2) && Boolean(countries) && !selectedCountry;

  const isProductsEnabled =
    (!urlState.categorySlug || Boolean(categories)) &&
    (!urlState.sourceCountryIso2 || Boolean(countries));

  const queryParams: GetProductsParams = {
    page: urlState.page,
    pageSize: urlState.pageSize,
    search: urlState.search,
    categoryId: selectedCategory?.id,
    sourceCountryId: selectedCountry?.id,
    minPrice: urlState.minPrice,
    maxPrice: urlState.maxPrice,
    minMoq: urlState.minMoq,
    maxMoq: urlState.maxMoq,
    sort: urlState.sort,
  };

  const {
    data: productsData,
    isLoading: isProductsLoading,
    isError: isProductsError,
    isFetching: isProductsFetching,
    refetch: refetchProducts,
  } = useProductsQuery(queryParams, { enabled: isProductsEnabled });

  /** Updates the URL with the given param changes, preserving every other existing param. */
  function updateParams(updates: Record<string, string | undefined>, resetPage: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    if (resetPage) {
      params.delete("page");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function goToPage(nextPage: number) {
    updateParams({ page: String(nextPage) }, false);
  }

  function handleSortChange(sort: string) {
    updateParams({ sort }, true);
  }

  function handleFiltersChange(next: ProductFiltersValue) {
    updateParams(
      {
        minMoq: next.minMoq?.toString(),
        maxMoq: next.maxMoq?.toString(),
        sourceCountry: next.sourceCountryIso2,
      },
      true,
    );
  }

  function handleFiltersReset() {
    updateParams(
      { minMoq: undefined, maxMoq: undefined, sourceCountry: undefined },
      true,
    );
  }

  if (isCategoriesLoading) {
    return (
      <main className="flex flex-col gap-7 px-7 pb-9 pt-[22px]">
        <div className="h-24 w-full animate-pulse rounded-[10px] border border-black/[0.09] bg-white" />
        <ProductGridSkeleton />
      </main>
    );
  }

  if (isCategoriesError) {
    return (
      <main className="flex flex-col items-center gap-3 px-7 py-16 text-center">
        <p className="text-[13px] text-ink/60">Couldn&apos;t load categories right now.</p>
        <Button variant="secondary" onClick={() => refetchCategories()}>
          Try again
        </Button>
      </main>
    );
  }

  if (hasInvalidCategory) {
    return (
      <main className="flex flex-col items-center gap-3 px-7 py-16 text-center">
        <p className="text-[13px] text-ink/60">
          We couldn&apos;t find that category.
        </p>
        <Button variant="secondary" onClick={() => router.push(routes.products)}>
          Browse all products
        </Button>
      </main>
    );
  }

  if (hasInvalidCountry) {
    return (
      <main className="flex flex-col items-center gap-3 px-7 py-16 text-center">
        <p className="text-[13px] text-ink/60">
          We couldn&apos;t find that country.
        </p>
        <Button variant="secondary" onClick={() => router.push(routes.products)}>
          Browse all products
        </Button>
      </main>
    );
  }

  const categoryName = selectedCategory?.name ?? "All Products";
  const categoryDescription =
    selectedCategory?.description ??
    "Browse every published product currently available on Looma.";

  const products = productsData?.items.map((item) => ({
    id: item.id,
    ...toProductCardProps(item),
  }));
  const pagination = productsData?.pagination;

  return (
    <main className="flex flex-col gap-7 px-7 pb-9 pt-[22px]">
      <CategoryIntro
        categoryName={categoryName}
        categorySlug={selectedCategory?.slug ?? null}
        description={categoryDescription}
        categories={categories ?? []}
      />

      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <ProductFilters
          categories={categories ?? []}
          selectedCategorySlug={selectedCategory?.slug ?? null}
          value={{
            minMoq: urlState.minMoq,
            maxMoq: urlState.maxMoq,
            sourceCountryIso2: urlState.sourceCountryIso2,
          }}
          onChange={handleFiltersChange}
          onReset={handleFiltersReset}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-[18px]">
          {pagination ? (
            <ProductsToolbar
              resultCount={pagination.totalItems}
              categoryName={categoryName}
              sort={urlState.sort ?? "newest"}
              onSortChange={handleSortChange}
            />
          ) : null}

          {isProductsLoading || !isProductsEnabled ? (
            <ProductGridSkeleton />
          ) : isProductsError ? (
            <div className="flex flex-col items-center gap-3 rounded-[10px] border border-black/[0.09] bg-white py-10 text-center">
              <p className="text-[13px] text-ink/60">
                Couldn&apos;t load products right now.
              </p>
              <Button variant="secondary" onClick={() => refetchProducts()}>
                Try again
              </Button>
            </div>
          ) : !products || products.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-[10px] border border-black/[0.09] bg-white py-10 text-center">
              <p className="text-[13px] text-ink/60">
                {selectedCategory
                  ? `No products available in ${categoryName} yet.`
                  : "No products match your current filters."}
              </p>
              <Button variant="secondary" onClick={() => router.push(routes.products)}>
                Browse all products
              </Button>
            </div>
          ) : (
            <ProductGrid products={products} />
          )}

          {pagination && pagination.totalPages > 1 ? (
            <ProductsPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              pageSize={pagination.pageSize}
              totalResults={pagination.totalItems}
              onPageChange={goToPage}
              isLoading={isProductsFetching}
            />
          ) : null}
        </div>
      </div>

      <TradeAndExport />
      <AssuranceBar />
    </main>
  );
}
