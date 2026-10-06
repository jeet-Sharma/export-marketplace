import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/vendor/StatusPill";
import type { BuyerRfqRequest } from "@/types/rfq";

export interface BuyerRfqPreviewCardProps {
  rfq: BuyerRfqRequest;
  onViewQuotes?: (rfq: BuyerRfqRequest) => void;
}

// One RFQ entry on the buyer dashboard preview list — the mirror of
// vendor/dashboard/RfqPreviewCard.tsx: instead of "New" + Send Quote
// (a vendor responding), this shows how many quotes have come back and a
// single "View Quotes" action, since the buyer is waiting on suppliers,
// not acting on them directly. Full list lives at
// components/buyer/rfq/BuyerRfqTable.tsx.
export default function BuyerRfqPreviewCard({ rfq, onViewQuotes }: BuyerRfqPreviewCardProps) {
  return (
    <article className="p-4 border border-line rounded bg-panel">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-heading font-semibold text-ink text-[14px]">
          {rfq.product}
        </h4>
        <StatusPill status={rfq.status} />
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
          <dt className="font-body text-text-dim text-[12px]">Quotes</dt>
          <dd className="font-heading font-medium mt-1 text-text text-[13px]">
            {rfq.quotesReceived > 0 ? (
              <Badge tone="teal">{rfq.quotesReceived} received</Badge>
            ) : (
              <span className="text-text-dim">Awaiting</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <Button
          variant="accent"
          size="sm"
          onClick={() => onViewQuotes?.(rfq)}
          disabled={!onViewQuotes || rfq.quotesReceived === 0}
        >
          View Quotes
        </Button>
      </div>
    </article>
  );
}
