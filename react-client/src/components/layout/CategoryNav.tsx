"use client";

import Link from "next/link";
import { routes } from "@/config/routes";
import { useCategoriesQuery } from "@/features/categories/api/categories.queries";

/**
 * Dark category navigation strip beneath the primary nav. Uses real
 * category data from GET /categories — not hardcoded names/slugs — per the
 * marketplace routing requirement that category navigation must use real
 * category data. Renders nothing extra while loading/erroring (the strip's
 * "All categories"/"Sell globally" links are always shown; this is a
 * decorative quick-nav strip, not a page's primary content, so a visible
 * loading/error state isn't warranted here the way it is on a full page).
 */
export function CategoryNav() {
  const { data: categories } = useCategoriesQuery();

  return (
    <nav className="flex h-10 flex-wrap items-center justify-between gap-x-4 bg-ink px-7 text-[13px] text-white">
      <Link href={routes.products} className="font-extrabold">
        ☰ All categories
      </Link>
      <Link href={routes.newArrivals} className="font-semibold">
        New arrivals
      </Link>
      {categories?.slice(0, 5).map((category) => (
        <Link
          key={category.id}
          href={routes.category(category.slug)}
          className="font-semibold"
        >
          {category.name}
        </Link>
      ))}
      <Link href={routes.sellGlobally} className="font-extrabold text-amber">
        Sell globally ↗
      </Link>
    </nav>
  );
}
