import Panel from "@/components/ui/Panel";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// Supplier info card shown on the product detail page.
export default function SupplierCard({ supplier }) {
  if (!supplier) return null;

  return (
    <Panel title="Supplier Info" bodyClassName="p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center justify-center font-heading font-bold bg-blue-grey text-panel w-10 h-10 rounded text-[13px] shrink-0">
          {supplier.initials}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-heading font-semibold text-ink text-[14px]">
              {supplier.name}
            </p>
            {supplier.verified && <Badge tone="teal">{"\u2713"} Verified</Badge>}
          </div>
          <p className="font-body text-text-dim text-[12px] mt-1">{supplier.country}</p>
        </div>
      </div>
      <p className="font-body text-text-dim text-[12px]">{supplier.responseTime}</p>
      <Button variant="ghost" size="sm" className="w-full">
        Chat
      </Button>
    </Panel>
  );
}
