"use client";

import Link from "next/link";
import { ProductCard } from "@/components/ui/ProductCard";
import { routes } from "@/config/routes";
import { useProductsQuery } from "@/features/products/api/products.queries";
import { toProductCardProps } from "@/features/products/api/products.mapper";

const TRENDING_PAGE_SIZE = 12;

/** Sort and filter control bar matching the Figma design. */
function SortFilterBar({ visibleCount }: { visibleCount: number }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {/* Active sort pill */}
        <button className="flex h-[34px] items-center rounded-full bg-ink px-[14px] text-[12px] font-bold text-white">
          Sort: Trending
        </button>
        {/* Filter outline pill */}
        <button className="flex h-[34px] items-center rounded-full border border-ink/25 bg-white px-[14px] text-[12px] font-semibold text-ink hover:border-ink/50 transition-colors">
          Filter: Verified suppliers
        </button>
      </div>
      <p className="text-[12px] text-ink/50">
        Showing {visibleCount} of {visibleCount} visible products
      </p>
    </div>
  );
}

/** Skeleton placeholder shown while the catalogue is loading. */
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: TRENDING_PAGE_SIZE }).map((_, index) => (
        <div
          key={index}
          aria-hidden
          className="h-[352px] animate-pulse rounded-[10px] border border-black/[0.09] bg-white"
        />
      ))}
    </div>
  );
}

/** "Trending across Looma" section — fetches the live catalogue (GET /products) and renders it as a grid with sort/filter bar. */
export function TrendingProducts() {
  const { data, isLoading, isError, refetch } = useProductsQuery({
    pageSize: TRENDING_PAGE_SIZE,
    sort: "newest",
  });

  const products = data?.items.map(toProductCardProps) ?? [];

  return (
    <section className="flex flex-col gap-[14px]">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-[3px] text-ink">
          <h2 className="text-[23px]">Trending across Looma</h2>
          <p className="text-[13px] opacity-[0.56]">
            Independent goods with exceptional customer ratings
          </p>
        </div>
        <Link href={routes.products} className="text-[13px] text-pink">
          See all trending →
        </Link>
      </div>

      {/* Sort & filter bar */}
      <SortFilterBar visibleCount={products.length} />

      {isLoading ? (
        <ProductGridSkeleton />
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-[10px] border border-black/[0.09] bg-white py-10 text-center">
          <p className="text-[13px] text-ink/60">
            Couldn&apos;t load trending products right now.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full border border-pink px-4 py-2 text-[13px] font-bold text-pink transition-colors hover:bg-pink/5"
          >
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-ink/60">
          No products available yet.
        </p>
      ) : (
        /* Responsive grid: 1 col on phones, scaling up to 4 on wide screens */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.name} {...product} />
          ))}
        </div>
      )}

      {/* Load more button */}
      <div className="flex justify-center pt-2">
        <button className="flex h-[42px] items-center rounded-full border-2 border-pink bg-white px-[28px] text-[13px] font-bold text-pink hover:bg-pink hover:text-white transition-colors">
          Load more products
        </button>
      </div>
    </section>
  );
}
