import { ProductCard } from "@/components/ui/ProductCard";
import type { Product } from "@/types/product";

interface ProductGridProps {
  /** Each product carries its own `id` (stable React key) and `slug` (card link target) — see products.mapper.ts callers. */
  products: Array<Product & { id: string; slug: string }>;
}

/** 3-column product grid for the catalogue/listing page, reusing the shared ProductCard. */
export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="product-grid-enter grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {products.map(({ id, ...product }) => (
        <ProductCard key={id} {...product} showViewAction />
      ))}
    </div>
  );
}
