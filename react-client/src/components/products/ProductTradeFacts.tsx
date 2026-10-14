import type { ApiProductDetail } from "@/features/products/types/product-api.types";

interface ProductTradeFactsProps {
  product: ApiProductDetail;
}

/** A single trade fact cell. Always renders the label; shows the API
 * value or a literal "—" when the field has no value, instead of hiding
 * the cell entirely. */
function Fact({
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
    <div className="flex min-w-[100px] flex-1 flex-col gap-1">
      <p className="text-[12px] text-ink/50">{label}</p>
      <p
        className={`text-[14px] font-bold ${
          hasValue ? (tone === "positive" ? "text-delivery" : "text-ink") : "text-ink/40"
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

/**
 * Trade facts grid, matching the Figma "Trade facts" 2-row x 3-column
 * layout (row 1: MOQ / HS code / Export eligibility, row 2: Delivery /
 * Duties / —). The Figma mock also shows an "Expiry" (shelf-life) cell —
 * there's no shelf-life column on the Product entity, so that cell is
 * intentionally left out rather than inventing a value. Duties is backed
 * by `dutiesTaxesNote`, which is free text (not a number) on the
 * backend, so it's shown as-is rather than reformatted as currency.
 * Fields that DO exist on the API but came back empty for this product
 * render as "—" rather than being hidden.
 */
export function ProductTradeFacts({ product }: ProductTradeFactsProps) {
  return (
    <div className="grid w-full grid-cols-3 gap-4 border-y border-border py-3">
      <Fact label="MOQ" value={product.moq ? `${product.moq} ${product.unit ?? ""}`.trim() : undefined} />
      <Fact label="HS code" value={product.hsCode} />
      <Fact
        label="Export eligibility"
        value={product.exportEligibility}
        tone={product.exportEligibility === "EXPORT_ELIGIBLE" ? "positive" : "default"}
      />
      <Fact label="Delivery" value={product.estimatedDeliveryText} tone="positive" />
      <Fact label="Duties" value={product.dutiesTaxesNote} />
    </div>
  );
}
