import Link from "next/link";
import { ProductBreadcrumb } from "@/components/products/ProductBreadcrumb";
import { ProductDetailTabs } from "@/components/products/ProductDetailTabs";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductPriceTiers } from "@/components/products/ProductPriceTiers";
import { ProductQuantityTiers } from "@/components/products/ProductQuantityTiers";
import { ProductShippingSummary } from "@/components/products/ProductShippingSummary";
import { ProductSpecifications } from "@/components/products/ProductSpecifications";
import { ProductSupplierCard } from "@/components/products/ProductSupplierCard";
import { ProductTradeFacts } from "@/components/products/ProductTradeFacts";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { routes } from "@/config/routes";
import { formatPrice } from "@/features/products/api/products.mapper";
import type { ApiProductDetail, ApiProductListItem } from "@/features/products/types/product-api.types";

interface ProductDetailViewProps {
  product: ApiProductDetail;
  relatedProducts: ApiProductListItem[];
}

/**
 * Full product detail content, matching the Figma "Product detail" layout
 * (gallery + purchase panel, section tabs, specifications, trade facts,
 * price tiers, shipping summary, supplier, related products) using only
 * fields the API response actually provides. Per the marketplace
 * requirements: "Only display fields supported by the actual API
 * response. Do not invent data." Several Figma elements have no backing
 * data at all and are intentionally omitted rather than faked:
 * organic/verified badges, buyer-inquiry counts, cart/buy-now/RFQ actions
 * (Phase 1 excludes cart/checkout/RFQ), save/heart button, document
 * checklist, and the supplier "verification overview" grid — none of
 * these have a corresponding database field or feature today.
 *
 * For fields the API DOES support but returned no value for on a given
 * product, we render a literal "—" instead of hiding the field, so the
 * page structure stays consistent across products.
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

        <div className="flex w-full flex-col gap-[26px] lg:flex-row lg:items-start">
          <div className="w-full lg:w-[58%]">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Purchase panel */}
          <div className="flex w-full flex-col gap-4 rounded-[16px] border border-border bg-white p-[22px] shadow-[0px_5px_18px_-2px_rgba(17,24,39,0.09)] lg:w-[42%]">
            <p className="text-[12px] font-extrabold uppercase tracking-wide text-pink">
              {product.sourceCountry?.name || "—"}
            </p>

            <h1 className="text-[30px] leading-[1.12] text-ink sm:text-[34px]">{product.name}</h1>

            <p className="text-[14px] leading-[1.5] text-ink/60">{product.description || "—"}</p>

            <div className="flex flex-col gap-[3px]">
              <p className="text-[12px] text-ink/50">Price</p>
              <p className="text-[24px] font-semibold text-ink">
                {formatPrice(product.price, product.currencyCode)}
                {product.unit ? (
                  <span className="ml-1 text-[14px] font-normal text-ink/50">/ {product.unit}</span>
                ) : null}
              </p>
            </div>

            <ProductQuantityTiers tiers={product.priceTiers} unit={product.unit} />

            <ProductTradeFacts product={product} />

            <p className="text-[13px] text-ink/60">
              <span className="text-ink/50">Country restrictions: </span>
              {product.countryRestrictions || "—"}
            </p>

            <div className="flex flex-col gap-2">
              <h2 className="text-[13px] font-bold text-ink">Available in</h2>
              <div className="flex flex-wrap gap-2">
                {product.targetCountries.length > 0 ? (
                  product.targetCountries.map((country) => (
                    <span
                      key={country.id}
                      className="rounded-full border border-border bg-cream px-3 py-1 text-[12px] text-ink"
                    >
                      {country.name}
                    </span>
                  ))
                ) : (
                  <span className="text-[12px] text-ink/40">—</span>
                )}
              </div>
            </div>

            <Link
              href={routes.products}
              className="text-[13px] font-bold text-pink hover:underline"
            >
              ← Back to all products
            </Link>
          </div>
        </div>
      </div>

      {/* Product details section + sidebar */}
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
