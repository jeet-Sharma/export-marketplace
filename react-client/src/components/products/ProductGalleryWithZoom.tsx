"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ProductGallery } from "@/components/products/ProductGallery";
import type { ZoomPanelProps } from "@/components/products/ProductGallery";
import { ProductPurchaseActions } from "@/components/products/ProductPurchaseActions";
import { ProductQuantityTiers } from "@/components/products/ProductQuantityTiers";
import { ProductTradeFacts } from "@/components/products/ProductTradeFacts";
import { routes } from "@/config/routes";
import { formatPrice } from "@/features/products/api/products.mapper";
import type { ApiProductDetail } from "@/features/products/types/product-api.types";

interface ProductGalleryWithZoomProps {
  product: ApiProductDetail;
}

/**
 * Gallery + right-column purchase panel with self-contained zoom state.
 *
 * Zoom geometry changes on every mousemove, so this component deliberately
 * owns `zoomActive` and `zoomProps` to prevent those frequent state updates
 * from propagating up to ProductDetailView and re-rendering unrelated
 * sections (specifications, supplier card, related products).
 *
 * Both panels are always mounted — the zoom panel and purchase panel are
 * toggled via visibility/pointerEvents — so stateful children such as
 * ProductQuantityTiers' selected tier survive hover cycles without unmounting.
 */
export function ProductGalleryWithZoom({ product }: ProductGalleryWithZoomProps) {
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
    <div className="flex w-full flex-col gap-[26px] lg:flex-row lg:items-start">
      {/* ── Gallery column (58%) ──────────────────────────────────────── */}
      <div className="w-full lg:w-[58%]">
        <ProductGallery
          images={product.images}
          productName={product.name}
          onZoomChange={handleZoomChange}
        />
      </div>

      {/* ── Right column (42%) ────────────────────────────────────────
       *
       * Both panels are always mounted so stateful children
       * (ProductQuantityTiers' activeIndex, etc.) survive hover
       * cycles. We toggle visibility + pointer-events via inline
       * style rather than conditional rendering — this prevents the
       * "tier selection resets when you move the mouse" bug caused
       * by unmounting/remounting the purchase card on every hover.
       *
       * The zoom panel is additionally hidden on coarse-pointer
       * devices via the .zoom-panel CSS rule in globals.css.
       */}
      <div className="relative w-full lg:w-[42%]">

        {/* Zoom panel — visible only while zoomActive */}
        <div
          aria-hidden
          className="zoom-panel absolute inset-0 zoom-panel-enter overflow-hidden rounded-[20px] border-2 border-pink/30 bg-white shadow-[0px_20px_60px_-12px_rgba(217,66,114,0.22),0px_4px_16px_-4px_rgba(17,24,39,0.14)]"
          style={{
            backgroundImage: zoomProps ? `url(${zoomProps.imageUrl})` : undefined,
            backgroundSize: zoomProps ? `${zoomProps.bgW}px ${zoomProps.bgH}px` : undefined,
            backgroundPosition: zoomProps ? `-${zoomProps.bpX}px -${zoomProps.bpY}px` : undefined,
            backgroundRepeat: "no-repeat",
            // Keep in DOM but invisible + non-interactive when not active.
            visibility: zoomActive && zoomProps ? "visible" : "hidden",
            pointerEvents: "none",
            // Match the purchase card's natural height so the column
            // doesn't collapse when the zoom panel is invisible.
            minHeight: "560px",
          }}
        >
          <span className="absolute right-3 top-3 flex items-center gap-[5px] rounded-full bg-pink px-[10px] py-[4px] text-[10px] font-bold uppercase tracking-wide text-white shadow-[0px_2px_8px_rgba(217,66,114,0.4)]">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <circle cx="4" cy="4" r="3" stroke="white" strokeWidth="1.4" />
              <line x1="6.5" y1="6.5" x2="9" y2="9" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Zoomed view
          </span>
          <div className="pointer-events-none absolute inset-0 rounded-[18px] shadow-[inset_0px_0px_32px_rgba(17,24,39,0.08)]" />
        </div>

        {/* Purchase panel — always mounted, hidden only while zoom is active */}
        <div
          className="flex w-full flex-col rounded-[16px] border border-border bg-white p-[22px] shadow-[0px_5px_18px_-2px_rgba(17,24,39,0.09)]"
          style={{
            visibility: zoomActive ? "hidden" : "visible",
            pointerEvents: zoomActive ? "none" : "auto",
          }}
        >
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
      </div>
    </div>
  );
}
