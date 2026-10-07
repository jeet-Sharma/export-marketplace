import Link from "next/link";
import { ProductCard } from "@/components/ui/ProductCard";
import { TRENDING_PRODUCTS } from "@/data/products";
import { routes } from "@/config/routes";

/** "Trending across Looma" section rendering the product grid. */
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

      {/* Responsive grid: 1 col on phones, scaling up to 4 on wide screens,
          so the row never forces horizontal overflow on small viewports. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TRENDING_PRODUCTS.map((product) => (
          <ProductCard key={product.name} {...product} />
        ))}
      </div>
    </section>
  );
}
