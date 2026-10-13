import Link from "next/link";
import { ProductCard } from "@/components/ui/ProductCard";
import { routes } from "@/config/routes";
import { toProductCardProps } from "@/features/products/api/products.mapper";
import type { ApiProductListItem } from "@/features/products/types/product-api.types";

interface RelatedProductsProps {
  products: ApiProductListItem[];
  categorySlug?: string | null;
}

/** "You may also need" — real published products from the same category, reusing the shared ProductCard. Renders nothing when there are none. */
export function RelatedProducts({ products, categorySlug }: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className="flex w-full flex-col gap-[18px]">
      <div className="flex items-end justify-between">
        <h2 className="text-[26px] text-ink">You may also need</h2>
        {categorySlug ? (
          <Link href={routes.category(categorySlug)} className="text-[13px] font-bold text-pink">
            Browse all →
          </Link>
        ) : null}
      </div>
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((item) => {
          const { slug, ...cardProps } = toProductCardProps(item);
          return <ProductCard key={item.id} slug={slug} {...cardProps} />;
        })}
      </div>
    </section>
  );
}
