"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ProductBreadcrumb } from "@/components/products/ProductBreadcrumb";
import { ProductDetailTabs } from "@/components/products/ProductDetailTabs";
import { ProductGallery } from "@/components/products/ProductGallery";
import type { ZoomPanelProps } from "@/components/products/ProductGallery";
import { ProductPriceTiers } from "@/components/products/ProductPriceTiers";
import { ProductPurchaseActions } from "@/components/products/ProductPurchaseActions";
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
 * Full product detail layout.
 *
 * The right-hand column (42%) normally shows the purchase panel.
 * When the user hovers over the featured image on a desktop (pointer: fine),
 * the gallery fires `onZoomChange` with the computed zoom geometry and the
 * purchase panel is replaced by an inline zoomed-image panel that fills the
 * exact same slot — matching the Amazon-style "zoom in place of detail card"
 * pattern requested.
 *
 * On touch/coarse-pointer devices the zoom is suppressed at the CSS level
 * (.zoom-lens { display:none }) so the purchase panel is always visible.
 */
export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomProps, setZoomProps] = useState<ZoomPanelProps | null>(null);

  const handleZoomChange = useCallback(
    (active: boolean, props: ZoomPanelProps | null) => {
      setZoomActive(active);
      setZoomProps(props);
    },
    [],
  );

  return (
    <main className="flex flex-col gap-[48px] px-7 pb-[48px] pt-[22px]">
      <div className="flex w-full flex-col gap-[18px]">
        <ProductBreadcrumb
          categoryName={product.category?.name}
          categorySlug={product.category?.slug}
          productName={product.name}
        />

        <div className="flex w-full flex-col gap-[26px] lg:flex-row lg:items-start">
          {/* ── Gallery column (58%) ──────────────────────────────────── */}
          <div className="w-full lg:w-[58%]">
            <ProductGallery
              images={product.images}
              productName={product.name}
              onZoomChange={handleZoomChange}
            />
          </div>

          {/* ── Right column (42%) — zoom panel OR purchase panel ──────── */}
          <div className="w-full lg:w-[42%]">
            {/*
             * Zoom panel: replaces the purchase card while the user hovers
             * over the main image. Hidden entirely on coarse-pointer devices
             * via the `.zoom-panel` CSS rule in globals.css so the purchase
             * card is always visible on mobile/tablet.
             */}
            {zoomActive && zoomProps ? (
              <div
                aria-hidden
                className="zoom-panel relative h-[560px] w-full overflow-hidden rounded-[20px] border-2 border-pink/30 bg-white shadow-[0px_20px_60px_-12px_rgba(217,66,114,0.22),0px_4px_16px_-4px_rgba(17,24,39,0.14)] zoom-panel-enter"
                style={{
                  backgroundImage: `url(${zoomProps.imageUrl})`,
                  backgroundSize: `${zoomProps.bgW}px ${zoomProps.bgH}px`,
                  backgroundPosition: `-${zoomProps.bpX}px -${zoomProps.bpY}px`,
                  backgroundRepeat: "no-repeat",
                }}
              >
                {/* "Zoomed view" label badge */}
                <span className="absolute right-3 top-3 flex items-center gap-[5px] rounded-full bg-pink px-[10px] py-[4px] text-[10px] font-bold uppercase tracking-wide text-white shadow-[0px_2px_8px_rgba(217,66,114,0.4)]">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <circle cx="4" cy="4" r="3" stroke="white" strokeWidth="1.4" />
                    <line x1="6.5" y1="6.5" x2="9" y2="9" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  Zoomed view
                </span>
                {/* Subtle inner vignette to frame the zoomed image */}
                <div className="pointer-events-none absolute inset-0 rounded-[18px] shadow-[inset_0px_0px_32px_rgba(17,24,39,0.08)]" />
              </div>
            ) : (
              /* Purchase panel — always visible when zoom is off */
              <div className="flex w-full flex-col rounded-[16px] border border-border bg-white p-[22px] shadow-[0px_5px_18px_-2px_rgba(17,24,39,0.09)]">

                <p className="text-[12px] font-semibold text-pink">
                  {product.vendor.displayName ?? product.vendor.companyName}
                  {product.sourceCountry?.name ? (
                    <span className="ml-1 font-normal text-ink/50">· {product.sourceCountry.name}</span>
                  ) : null}
                </p>

                <h1 className="mt-[4px] text-[22px] font-bold leading-[1.2] text-ink sm:text-[24px]">
                  {product.name}
                </h1>

                {product.description ? (
                  <p className="mt-[4px] text-[13px] leading-[1.4] text-ink/60">
                    {product.description}
                  </p>
                ) : null}

                <div className="my-[10px] h-px w-full bg-border" />

                <div className="flex items-baseline gap-[5px]">
                  <p className="text-[26px] font-bold leading-none text-ink">
                    {formatPrice(product.price, product.currencyCode)}
                  </p>
                  {product.unit ? (
                    <span className="text-[13px] text-ink/50">/ {product.unit}</span>
                  ) : null}
                </div>

                <div className="mt-[8px]">
                  <ProductQuantityTiers tiers={product.priceTiers} unit={product.unit} />
                </div>

                <div className="my-[10px] h-px w-full bg-border" />

                <ProductTradeFacts product={product} />

                {product.countryRestrictions ? (
                  <p className="mt-[6px] text-[13px] text-ink/60">
                    <span className="font-semibold text-ink/50">Country restrictions: </span>
                    {product.countryRestrictions}
                  </p>
                ) : null}

                {product.targetCountries.length > 0 ? (
                  <div className="mt-[6px] flex flex-col gap-[5px]">
                    <p className="text-[12px] font-semibold text-ink/50">Available in</p>
                    <div className="flex flex-wrap gap-[5px]">
                      {product.targetCountries.map((country) => (
                        <span
                          key={country.id}
                          className="rounded-full border border-border bg-cream px-[10px] py-[3px] text-[12px] text-ink"
                        >
                          {country.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="my-[12px] h-px w-full bg-border" />

                <ProductPurchaseActions slug={product.slug} />

                <Link
                  href={routes.products}
                  className="mt-[8px] text-[12px] text-ink/40 transition-colors hover:text-pink hover:underline"
                >
                  ← Back to all products
                </Link>
              </div>
            )}
          </div>
        </div>
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
