"use client";

import { useState } from "react";
import type { ApiProductPriceTier } from "@/features/products/types/product-api.types";
import { formatPrice } from "@/features/products/api/products.mapper";

interface ProductQuantityTiersProps {
  tiers: ApiProductPriceTier[];
  unit: string | null;
}

function formatQuantityRange(tier: ApiProductPriceTier, unit: string | null): string {
  const unitLabel = unit ?? "";
  const min = Number(tier.minQuantity);
  if (!tier.maxQuantity) {
    return `${min}${unitLabel ? ` ${unitLabel}` : ""}+`;
  }
  const max = Number(tier.maxQuantity);
  return `${min}–${max}${unitLabel ? ` ${unitLabel}` : ""}`;
}

/**
 * Quantity-tier pill selector for the purchase panel, matching the Figma
 * "Quantity tiers" pills. Backed entirely by the product's real
 * `priceTiers` — the same data already shown in the detailed
 * `ProductPriceTiers` table further down the page, just presented as
 * selectable pills here. Selecting a pill updates the displayed price to
 * that tier's price; it does not add anything to a cart or submit a
 * quote (Phase 1 has no cart/RFQ feature).
 */
export function ProductQuantityTiers({ tiers, unit }: ProductQuantityTiersProps) {
  const sorted = [...tiers].sort((a, b) => Number(a.minQuantity) - Number(b.minQuantity));
  const [activeIndex, setActiveIndex] = useState(0);

  if (sorted.length === 0) {
    return null;
  }

  const active = sorted[activeIndex];

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] text-ink/50">Quantity tiers</p>
      <div className="flex flex-wrap gap-2">
        {sorted.map((tier, index) => (
          <button
            key={tier.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-pressed={index === activeIndex}
            className={`rounded-[10px] border px-4 py-2 text-[13px] font-bold transition-colors ${
              index === activeIndex
                ? "border-pink bg-pink/10 text-pink"
                : "border-border bg-white text-ink hover:border-pink/40"
            }`}
          >
            {formatQuantityRange(tier, unit)}
          </button>
        ))}
      </div>
      <p className="text-[13px] text-ink/60">
        {formatPrice(active.price, active.currencyCode)} per {unit ?? "unit"} at this tier
      </p>
    </div>
  );
}
