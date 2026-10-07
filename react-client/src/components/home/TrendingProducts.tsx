import { ProductCard } from "@/components/ui/ProductCard";
import { TRENDING_PRODUCTS } from "@/data/products";

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
        <a href="#" className="text-[13px] text-pink">
          See all trending →
        </a>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {TRENDING_PRODUCTS.map((product) => (
          <ProductCard key={product.name} {...product} />
        ))}
      </div>
    </section>
  );
}
