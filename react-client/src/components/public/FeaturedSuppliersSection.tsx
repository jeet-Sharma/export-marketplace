import Panel from "@/components/ui/Panel";
import Badge from "@/components/ui/Badge";
import { featuredSuppliers } from "@/data/public";

// Featured / verified suppliers row.
export default function FeaturedSuppliersSection() {
  return (
    <section className="w-full px-4 py-10 sm:px-6">
      <h2 className="font-heading font-bold text-ink text-[22px] mb-4">
        Featured Suppliers
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {featuredSuppliers.map((supplier) => (
          <Panel key={supplier.id} bodyClassName="p-4 flex items-center gap-3">
            <span className="inline-flex items-center justify-center font-heading font-bold bg-blue-grey text-panel w-10 h-10 rounded text-[13px] shrink-0">
              {supplier.initials}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-heading font-semibold text-ink text-[14px] truncate">
                  {supplier.name}
                </p>
                {supplier.verified && <Badge tone="teal">{"\u2713"} Verified</Badge>}
              </div>
              <p className="font-body text-text-dim text-[12px] mt-1">
                {supplier.country} {"\u00B7"} {supplier.categories}
              </p>
            </div>
          </Panel>
        ))}
      </div>
    </section>
  );
}
