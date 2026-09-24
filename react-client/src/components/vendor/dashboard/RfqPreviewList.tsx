import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import RfqPreviewCard from "@/components/vendor/dashboard/RfqPreviewCard";
import type { PendingRfq } from "@/types/rfq";

export interface RfqPreviewListProps {
  rfqs?: PendingRfq[];
  title?: string;
  onSendQuote?: (rfq: PendingRfq) => void;
  onViewDetails?: (rfq: PendingRfq) => void;
  onViewAll?: () => void;
}

// Dashboard-only preview of a few pending RFQs, with a link out to the full
// RFQ table (components/vendor/rfq/RfqTable.jsx). Not the same component —
// this one has no search/filter and always shows a "New" pill.
export default function RfqPreviewList({
  rfqs = [],
  title = "Pending RFQs",
  onSendQuote,
  onViewDetails,
  onViewAll,
}: RfqPreviewListProps) {
  return (
    <Panel
      title={title}
      action={<Badge tone="neutral">{rfqs.length} open</Badge>}
      bodyClassName="p-4"
    >
      <div className="flex flex-col gap-3">
        {rfqs.length === 0 ? (
          <p className="font-body text-text-dim text-[13px]">
            No pending RFQs right now.
          </p>
        ) : (
          rfqs.map((rfq) => (
            <RfqPreviewCard
              key={rfq.id}
              rfq={rfq}
              onSendQuote={onSendQuote}
              onViewDetails={onViewDetails}
            />
          ))
        )}
      </div>

      <div className="mt-4">
        <Button variant="primary" size="md" className="w-full" onClick={onViewAll}>
          View all RFQs
        </Button>
      </div>
    </Panel>
  );
}
