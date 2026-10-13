import type { ApiProductDetail } from "@/features/products/types/product-api.types";

interface ProductSpecificationsProps {
  product: ApiProductDetail;
}

interface SpecRow {
  label: string;
  value: string | null | undefined;
}

/** A single specification row. The API field is always shown; when the
 * value is absent we render a literal "—" rather than hiding the row. */
function Row({ label, value }: SpecRow) {
  return (
    <div className="flex min-h-[42px] w-full gap-6 border-b border-border py-[10px] text-[13px] last:border-b-0">
      <p className="w-[180px] shrink-0 text-ink/50">{label}</p>
      <p className="flex-1 font-semibold text-ink">{value || "—"}</p>
    </div>
  );
}

/**
 * Specifications table matching the Figma "Specifications" section — a
 * plain key/value list built only from real Product fields. Figma's own
 * "Quantity tiers" spec row is covered by the real bulk price tiers table
 * elsewhere on the page, so it isn't duplicated here. Fields the API has
 * no value for still render as a row, with "—" standing in for the
 * missing value instead of being omitted.
 */
export function ProductSpecifications({ product }: ProductSpecificationsProps) {
  const rows: SpecRow[] = [
    { label: "Product", value: product.name },
    { label: "Category", value: product.category?.name },
    { label: "Minimum order", value: product.moq ? `${product.moq} ${product.unit ?? ""}`.trim() : undefined },
    { label: "Unit", value: product.unit },
    { label: "HS code", value: product.hsCode },
    { label: "Source country", value: product.sourceCountry?.name },
    { label: "Export eligibility", value: product.exportEligibility },
  ];

  return (
    <div id="specifications" className="flex w-full flex-col gap-[6px]">
      <h2 className="text-[20px] text-ink">Specifications</h2>
      <div className="flex w-full flex-col text-[13px]">
        {rows.map((row) => (
          <Row key={row.label} {...row} />
        ))}
      </div>
    </div>
  );
}
