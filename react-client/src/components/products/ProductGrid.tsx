import { ProductCard } from "@/components/ui/ProductCard";
import type { Product } from "@/types/product";

interface ProductGridProps {
  products: Product[];
}

/** 3-column product grid for the catalogue/listing page, reusing the shared ProductCard. */
export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.name} {...product} showRfqAction />
      ))}
    </div>
  );
}
