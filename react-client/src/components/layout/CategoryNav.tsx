"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
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

/**
 * Inner component that reads searchParams — must be wrapped in Suspense
 * because useSearchParams opts out of static prerendering on Next.js App
 * Router. CategoryNav places the Suspense boundary here so the nav strip
 * renders immediately (without any loading state) and the active-link
 * highlighting is hydrated client-side.
 */
function CategoryNavInner() {
  const { data: categories } = useCategoriesQuery();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category");
  const isProductsPage = pathname === "/products";

  return (
    <>
      <Link
        href={routes.products}
        aria-current={isProductsPage && !currentCategory ? "page" : undefined}
        className={`font-extrabold transition-opacity duration-150 hover:opacity-80 ${isProductsPage && !currentCategory ? "opacity-100" : "opacity-70"}`}
      >
        ☰ All categories
      </Link>
      <Link
        href={routes.newArrivals}
        className="font-semibold opacity-70 transition-opacity duration-150 hover:opacity-100"
      >
        New arrivals
      </Link>
      {categories?.slice(0, 5).map((category) => {
        const isActive = currentCategory === category.slug;
        return (
          <Link
            key={category.id}
            href={routes.category(category.slug)}
            aria-current={isActive ? "page" : undefined}
            className={`font-semibold transition-opacity duration-150 hover:opacity-100 ${isActive ? "opacity-100 underline underline-offset-2" : "opacity-70"}`}
          >
            {category.name}
          </Link>
        );
      })}
      <Link
        href={routes.sellGlobally}
        className="font-extrabold text-amber opacity-90 transition-opacity duration-150 hover:opacity-100"
      >
        Sell globally ↗
      </Link>
    </>
  );
}

/** Category nav with Suspense boundary so useSearchParams doesn't block prerendering. */
export function CategoryNav() {
  return (
    <nav
      aria-label="Category navigation"
      className="flex h-10 flex-wrap items-center justify-between gap-x-4 bg-ink px-7 text-[13px] text-white"
    >
      <Suspense
        fallback={
          <>
            <Link href={routes.products} className="font-extrabold opacity-70">
              ☰ All categories
            </Link>
            <Link href={routes.newArrivals} className="font-semibold opacity-70">
              New arrivals
            </Link>
            <Link href={routes.sellGlobally} className="font-extrabold text-amber opacity-90">
              Sell globally ↗
            </Link>
          </>
        }
      >
        <CategoryNavInner />
      </Suspense>
    </nav>
  );
}
