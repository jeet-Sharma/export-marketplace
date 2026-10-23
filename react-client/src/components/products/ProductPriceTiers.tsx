import type { ApiProductPriceTier } from "@/features/products/types/product-api.types";
import { formatPrice } from "@/features/products/api/products.mapper";

interface ProductPriceTiersProps {
  tiers: ApiProductPriceTier[];
}

function formatQuantityRange(tier: ApiProductPriceTier): string {
  const min = Number(tier.minQuantity);
  if (!tier.maxQuantity) {
    return `${min}+`;
  }
  const max = Number(tier.maxQuantity);
  return `${min}–${max}`;
}

/**
 * Bulk price tier table. Shipping/duties/taxes are explicitly labeled as
 * estimates — see marketplace routing requirements: "clearly label
 * shipping, duties and taxes as estimates." A tier's shipping/duties/taxes
 * fields are each independently nullable, so each cell falls back to
 * "—" rather than fabricating a value or hiding the whole row.
 */
export function ProductPriceTiers({ tiers }: ProductPriceTiersProps) {
  if (tiers.length === 0) {
    return null;
  }

  const sorted = [...tiers].sort((a, b) => Number(a.minQuantity) - Number(b.minQuantity));

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-[15px] font-bold text-ink">Bulk price tiers</h2>
      <div className="overflow-x-auto rounded-[10px] border border-black/[0.09]">
        <table className="w-full min-w-[480px] text-left text-[13px]">
          <thead className="bg-cream text-ink/60">
            <tr>
              <th className="px-3 py-2 font-semibold">Quantity</th>
              <th className="px-3 py-2 font-semibold">Price</th>
              <th className="px-3 py-2 font-semibold">Shipping (est.)</th>
              <th className="px-3 py-2 font-semibold">Duties (est.)</th>
              <th className="px-3 py-2 font-semibold">Taxes (est.)</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((tier) => (
              <tr key={tier.id} className="border-t border-black/[0.09]">
                <td className="px-3 py-2 text-ink">{formatQuantityRange(tier)} units</td>
                <td className="px-3 py-2 font-semibold text-ink">
                  {formatPrice(tier.price, tier.currencyCode)}
                </td>
                <td className="px-3 py-2 text-ink/70">
                  {tier.shippingEstimate ? formatPrice(tier.shippingEstimate, tier.currencyCode) : "—"}
                </td>
                <td className="px-3 py-2 text-ink/70">
                  {tier.dutiesEstimate ? formatPrice(tier.dutiesEstimate, tier.currencyCode) : "—"}
                </td>
                <td className="px-3 py-2 text-ink/70">
                  {tier.taxesEstimate ? formatPrice(tier.taxesEstimate, tier.currencyCode) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-ink/50">
        Shipping, duties and taxes shown above are estimates only and may vary
        by destination and shipment.
      </p>
    </div>
  );
}
