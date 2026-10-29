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
 * Quantity-tier pill selector — compact Amazon-style size/variant chips.
 * Selected pill is outlined in pink. Price shown inline below the pills.
 */
export function ProductQuantityTiers({ tiers, unit }: ProductQuantityTiersProps) {
  const sorted = [...tiers].sort((a, b) => Number(a.minQuantity) - Number(b.minQuantity));
  const [activeIndex, setActiveIndex] = useState(0);

  if (sorted.length === 0) {
    return null;
  }

  const active = sorted[activeIndex];

  return (
    <div className="flex flex-col gap-[5px]">
      {/* "Quantity tier: 7 kg+  ·  $708.00 / kg" — like Amazon's "Size: 512 GB" */}
      <p className="text-[13px] text-ink/60">
        <span className="font-semibold text-ink">Quantity tier: </span>
        {formatQuantityRange(active, unit)} ·{" "}
        <span className="font-semibold text-ink">
          {formatPrice(active.price, active.currencyCode)}
        </span>
        <span className="text-ink/50"> / {unit ?? "unit"}</span>
      </p>

      {/* Compact selector chips — like Amazon's 128 GB / 256 GB / 512 GB row */}
      <div className="flex flex-wrap gap-[5px]">
        {sorted.map((tier, index) => (
          <button
            key={tier.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-pressed={index === activeIndex}
            className={`rounded-[6px] border px-[10px] py-[4px] text-[12px] font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-1 ${
              index === activeIndex
                ? "border-pink bg-pink/5 font-semibold text-pink shadow-[0_0_0_1px_rgba(217,66,114,0.25)]"
                : "border-border bg-white text-ink hover:border-pink/50"
            }`}
          >
            {formatQuantityRange(tier, unit)}
          </button>
        ))}
      </div>
    </div>
  );
}
