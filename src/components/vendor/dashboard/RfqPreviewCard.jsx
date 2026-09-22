import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// One RFQ entry on the dashboard preview list: product + "New" pill,
// quantity / target price / destination. Not the full RFQ table —
// see components/vendor/rfq/RfqTable.jsx for that.
export default function RfqPreviewCard({ rfq }) {
  return (
    <article className="p-4 border border-line rounded bg-panel">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-heading font-semibold text-ink text-[14px]">
          {rfq.product}
        </h4>
        {rfq.isNew && <Badge tone="saffron">New</Badge>}
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <dt className="font-body text-text-dim text-[12px]">Quantity</dt>
          <dd className="font-heading font-medium mt-1 text-text text-[13px]">
            {rfq.quantity}
          </dd>
        </div>
        <div>
          <dt className="font-body text-text-dim text-[12px]">Target</dt>
          <dd className="font-heading font-medium mt-1 text-text text-[13px]">
            {rfq.target}
          </dd>
        </div>
        <div>
          <dt className="font-body text-text-dim text-[12px]">Destination</dt>
          <dd className="font-heading font-medium mt-1 text-text text-[13px]">
            {rfq.country}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center gap-2">
        <Button variant="accent" size="sm">
          Send Quote
        </Button>
        <Button variant="ghost" size="sm">
          Details
        </Button>
      </div>
    </article>
  );
}
