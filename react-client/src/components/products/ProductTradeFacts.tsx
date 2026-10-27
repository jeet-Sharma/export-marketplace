import type { ApiProductDetail } from "@/features/products/types/product-api.types";

interface ProductTradeFactsProps {
  product: ApiProductDetail;
}

/**
 * A single inline spec row: "Label   Value" on one line, like Amazon's
 * product spec table. Always renders; missing values show "—".
 */
function SpecRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | null | undefined;
  tone?: "default" | "positive";
}) {
  const hasValue = Boolean(value);
  return (
    <div className="flex items-baseline gap-2 text-[13px]">
      <span className="w-[130px] shrink-0 font-semibold text-ink/60">{label}</span>
      <span
        className={
          hasValue
            ? tone === "positive"
              ? "font-semibold text-delivery"
              : "text-ink"
            : "text-ink/35"
        }
      >
        {value || "—"}
      </span>
    </div>
  );
}

/**
 * Inline trade facts — Amazon-style "label  value" rows, replacing the
 * large grid cells. Compact and scannable without taking up vertical space.
 */
export function ProductTradeFacts({ product }: ProductTradeFactsProps) {
  return (
    <div className="flex flex-col gap-[5px]">
      <SpecRow
        label="MOQ"
        value={product.moq ? `${product.moq} ${product.unit ?? ""}`.trim() : undefined}
      />
      <SpecRow label="HS code" value={product.hsCode} />
      <SpecRow
        label="Export eligibility"
        value={product.exportEligibility}
        tone={product.exportEligibility === "EXPORT_ELIGIBLE" ? "positive" : "default"}
      />
      <SpecRow label="Delivery" value={product.estimatedDeliveryText} tone="positive" />
      <SpecRow label="Duties" value={product.dutiesTaxesNote} />
    </div>
  );
}
