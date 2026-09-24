import type { Product } from "@/lib/products";

export interface ComplianceFactsProps {
  product: Pick<Product, "hsCode" | "exportEligibility" | "countryRestriction" | "expiry">;
}

// Compliance/eligibility fact list: HS code, export eligibility, country
// restriction and expiry, per the product detail spec.
export default function ComplianceFacts({ product }: ComplianceFactsProps) {
  const facts = [
    { label: "HS Code", value: product.hsCode },
    { label: "Export Eligibility", value: product.exportEligibility },
    { label: "Country Restriction", value: product.countryRestriction },
    { label: "Expiry", value: product.expiry },
  ];

  return (
    <dl className="grid grid-cols-2 gap-3">
      {facts.map((fact) => (
        <div key={fact.label} className="bg-paper rounded px-3 py-2">
          <dt className="font-body text-text-dim text-[11px]">{fact.label}</dt>
          <dd className="font-heading font-semibold text-ink text-[13px] mt-0.5">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
