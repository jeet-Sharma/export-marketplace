"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ui/ProductCard";
import { routes } from "@/config/routes";
import { useProductsInfiniteQuery } from "@/features/products/api/products.queries";
import { toProductCardProps } from "@/features/products/api/products.mapper";

const TRENDING_PAGE_SIZE = 12;

/** Result count row — only shown once real data has loaded. */
function ResultsSummary({
  visibleCount,
  totalCount,
}: {
  visibleCount: number;
  totalCount: number;
}) {
  // Don't render the summary at all while still loading or if the total is
  // not yet known — avoids "0 of 0" flickering before the first API page
  // arrives, and avoids a stale "N of 0" flash during cache revalidation.
  if (totalCount <= 0) return null;
  return (
    <div className="flex items-center justify-end">
      <p className="text-[12px] text-ink/50">
        Showing {visibleCount} of {totalCount} visible products
      </p>
    </div>
  );
}

/** Skeleton placeholder shown while the catalogue is loading. */
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: TRENDING_PAGE_SIZE }).map((_, index) => (
        <div
          key={index}
          aria-hidden
          className="skeleton-shimmer h-[278px] rounded-[10px] border border-black/[0.09]"
        />
      ))}
    </div>
  );
}

/** "Trending across Export Marketplace" section — fetches the live catalogue (GET /products) and renders it as a grid with sort/filter bar and "Load more" pagination. */
export function TrendingProducts() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProductsInfiniteQuery({
    pageSize: TRENDING_PAGE_SIZE,
    sort: "newest",
  });

  const products =
    data?.pages.flatMap((page) =>
      page.items.map((item) => ({ id: item.id, ...toProductCardProps(item) })),
    ) ?? [];

  return (
    <section className="flex flex-col gap-[10px]">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-[2px] text-ink">
          <h2 className="text-[20px]">Trending across Export Marketplace</h2>
          <p className="text-[12px] opacity-[0.56]">
            Independent goods with exceptional customer ratings
          </p>
        </div>
        <Link href={routes.products} className="text-[13px] text-pink">
          See all trending →
        </Link>
      </div>

      {isLoading ? (
        <ProductGridSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-[10px] border border-black/[0.09] bg-white py-10 text-center">
          <p className="text-[13px] text-ink/60">
            Couldn&apos;t load trending products right now.
          </p>
          <Button variant="secondary" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : products.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-ink/60">
          No products available yet.
        </p>
      ) : (
        <>
          {/* Only show the summary once real data has loaded — avoids "0 of 0"
              flicker during the initial fetch or a cache revalidation cycle. */}
          <ResultsSummary
            visibleCount={products.length}
            totalCount={data?.pages[0]?.pagination.totalItems ?? 0}
          />
          {/* Responsive grid: 1 col on phones, scaling up to 4 on wide screens */}
          <div className="product-grid-enter grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {products.map(({ id, ...product }) => (
              <ProductCard key={id} {...product} showViewAction />
            ))}
          </div>
        </>
      )}

      {/* Load more button — hidden once every product has been loaded (hasNextPage is false). */}
      {hasNextPage ? (
        <div className="flex justify-center pt-2">
          <Button
            variant="secondary"
            onClick={() => fetchNextPage()}
            loading={isFetchingNextPage}
          >
            Load more products
          </Button>
        </div>
      ) : null}
    </section>
  );
}
