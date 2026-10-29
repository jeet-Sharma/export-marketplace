import { ProductBreadcrumb } from "@/components/products/ProductBreadcrumb";
import { ProductDetailTabs } from "@/components/products/ProductDetailTabs";
import { ProductGalleryWithZoom } from "@/components/products/ProductGalleryWithZoom";
import { ProductPriceTiers } from "@/components/products/ProductPriceTiers";
import { ProductShippingSummary } from "@/components/products/ProductShippingSummary";
import { ProductSpecifications } from "@/components/products/ProductSpecifications";
import { ProductSupplierCard } from "@/components/products/ProductSupplierCard";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import type { ApiProductDetail, ApiProductListItem } from "@/features/products/types/product-api.types";

interface ProductDetailViewProps {
  product: ApiProductDetail;
  relatedProducts: ApiProductListItem[];
}

/**
 * Full product detail layout — Server Component.
 *
 * Zoom state (which changes on every mousemove) lives inside
 * ProductGalleryWithZoom so it never causes this component — or
 * the specifications, supplier card, and related products below
 * the fold — to re-render.
 */
export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  return (
    <main className="flex flex-col gap-[48px] px-7 pb-[48px] pt-[22px]">
      <div className="flex w-full flex-col gap-[18px]">
        <ProductBreadcrumb
          categoryName={product.category?.name}
          categorySlug={product.category?.slug}
          productName={product.name}
        />

        <ProductGalleryWithZoom product={product} />
      </div>

      {/* ── Lower sections ─────────────────────────────────────────────── */}
      <div id="product-details" className="flex w-full flex-col gap-6">
        <ProductDetailTabs />

        <div className="flex w-full flex-col gap-7 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 flex-col gap-7">
            <ProductSpecifications product={product} />
            <ProductPriceTiers tiers={product.priceTiers} />
          </div>
          <ProductShippingSummary product={product} />
        </div>
      </div>

      <ProductSupplierCard vendor={product.vendor} />

      <RelatedProducts products={relatedProducts} categorySlug={product.category?.slug} />
    </main>
  );
}
