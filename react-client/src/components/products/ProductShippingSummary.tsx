import type { ApiProductDetail } from "@/features/products/types/product-api.types";
import { formatPrice } from "@/features/products/api/products.mapper";

interface ProductShippingSummaryProps {
  product: ApiProductDetail;
}

/** A single shipping fact row. Always renders the label; shows the API
 * value or a literal "—" when the field has no value, instead of hiding
 * the row entirely. */
function Row({
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
    <div className="flex w-full items-center justify-between text-[13px]">
      <p className="text-ink/50">{label}</p>
      <p className={`font-bold ${hasValue ? (tone === "positive" ? "text-delivery" : "text-ink") : "text-ink/40"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

/**
 * Boxed shipping/estimate summary card, matching the Figma sidebar card.
 * Always renders — fields the API has no value for show "—" rather than
 * disappearing, so the card's structure stays stable across products.
 * Shipping and duties are explicitly described as estimates in the
 * footer note — never implied as final figures (see marketplace
 * requirements: "clearly label shipping, duties and taxes as estimates").
 */
export function ProductShippingSummary({ product }: ProductShippingSummaryProps) {
  return (
    <div
      id="shipping-duties"
      className="flex w-full flex-col gap-[14px] rounded-[16px] border border-border bg-white p-5 lg:w-[320px]"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-[15px] font-bold text-ink">Shipping &amp; duties</h2>
        {product.moq ? (
          <p className="text-[12px] text-ink/50">
            Based on {product.moq} {product.unit ?? ""} minimum order
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-[10px] border-t border-border pt-3">
        <Row label="Estimated delivery" value={product.estimatedDeliveryText} tone="positive" />
        <Row label="Export eligibility" value={product.exportEligibility} tone="positive" />
        <Row label="Price" value={formatPrice(product.price, product.currencyCode)} />
      </div>
      <p className="border-t border-border pt-3 text-[12px] leading-[1.5] text-ink/60">
        {product.dutiesTaxesNote || "—"}
      </p>
      <p className="text-[11px] leading-[1.45] text-ink/50">
        Shipping and duties shown here are estimates only. Confirm final
        logistics and charges directly with the supplier.
      </p>
    </div>
  );
}
