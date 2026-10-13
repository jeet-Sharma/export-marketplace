"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { routes } from "@/config/routes";
import { useCategoriesQuery } from "@/features/categories/api/categories.queries";

/** Skeleton chip placeholders shown while categories are loading. */
function CategoryChipsSkeleton() {
  return (
    <div className="flex flex-wrap gap-[10px]">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          aria-hidden
          className="h-[46px] min-w-[140px] flex-1 animate-pulse rounded-[10px] border border-black/[0.09] bg-white"
        />
      ))}
    </div>
  );
}

/** "Shop by category" section with a row of category chips, fetched live from GET /categories. */
export function ShopByCategory() {
  const { data: categories, isLoading, isError, refetch } = useCategoriesQuery();

  return (
    <section className="flex flex-col gap-[13px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[23px] text-ink">Shop by category</h2>
        <Link href={routes.categories} className="text-[13px] text-pink">
          View all categories →
        </Link>
      </div>

      {isLoading ? (
        <CategoryChipsSkeleton />
      ) : isError ? (
        <div className="flex items-center gap-3 rounded-[10px] border border-black/[0.09] bg-white px-4 py-3">
          <p className="text-[13px] text-ink/60">Couldn&apos;t load categories.</p>
          <Button variant="secondary" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : !categories || categories.length === 0 ? (
        <p className="text-[13px] text-ink/60">No categories available yet.</p>
      ) : (
        <div className="flex flex-wrap gap-[10px]">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={routes.category(category.slug)}
              className="flex h-[46px] min-w-[140px] flex-1 items-center justify-center rounded-[10px] border border-pink bg-white text-[13px] text-ink shadow-[0px_5px_18px_-2px_rgba(17,24,39,0.09)]"
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
