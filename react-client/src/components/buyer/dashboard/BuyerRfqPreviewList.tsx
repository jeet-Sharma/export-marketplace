import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import BuyerRfqPreviewCard from "@/components/buyer/dashboard/BuyerRfqPreviewCard";
import type { BuyerRfqRequest } from "@/types/rfq";

export interface BuyerRfqPreviewListProps {
  rfqs?: BuyerRfqRequest[];
  title?: string;
  onViewQuotes?: (rfq: BuyerRfqRequest) => void;
  onViewAll?: () => void;
}

// Dashboard-only preview of a few RFQs the buyer has sent, mirroring
// vendor/dashboard/RfqPreviewList.tsx. Full list + compare-quotes view
// lives at components/buyer/rfq/BuyerRfqPage.tsx.
export default function BuyerRfqPreviewList({
  rfqs = [],
  title = "My RFQs",
  onViewQuotes,
  onViewAll,
}: BuyerRfqPreviewListProps) {
  return (
    <Panel
      title={title}
      action={<Badge tone="neutral">{rfqs.length} open</Badge>}
      bodyClassName="p-4"
    >
      <div className="flex flex-col gap-3">
        {rfqs.length === 0 ? (
          <p className="font-body text-text-dim text-[13px]">
            You haven&apos;t sent any RFQs yet.
          </p>
        ) : (
          rfqs.map((rfq) => (
            <BuyerRfqPreviewCard key={rfq.id} rfq={rfq} onViewQuotes={onViewQuotes} />
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
