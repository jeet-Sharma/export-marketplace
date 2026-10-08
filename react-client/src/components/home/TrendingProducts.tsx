import Link from "next/link";
import { ProductCard } from "@/components/ui/ProductCard";
import { TRENDING_PRODUCTS } from "@/data/products";
import { routes } from "@/config/routes";

/** Sort and filter control bar matching the Figma design. */
function SortFilterBar() {
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
        Showing {TRENDING_PRODUCTS.length} of {TRENDING_PRODUCTS.length} visible products
      </p>
    </div>
  );
}

/** "Trending across Looma" section rendering the product grid with sort/filter bar. */
export function TrendingProducts() {
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
      <SortFilterBar />

      {/* Responsive grid: 1 col on phones, scaling up to 4 on wide screens */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TRENDING_PRODUCTS.map((product) => (
          <ProductCard key={product.name} {...product} />
        ))}
      </div>

      {/* Load more button */}
      <div className="flex justify-center pt-2">
        <button className="flex h-[42px] items-center rounded-full border-2 border-pink bg-white px-[28px] text-[13px] font-bold text-pink hover:bg-pink hover:text-white transition-colors">
          Load more products
        </button>
      </div>
    </section>
  );
}
