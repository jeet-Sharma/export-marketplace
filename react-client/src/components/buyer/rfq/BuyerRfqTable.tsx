import Panel from "@/components/ui/Panel";
import Table, { cellClassName } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import StatusPill from "@/components/vendor/StatusPill";
import { buyerRfqMeta } from "@/data/buyerRfq";
import type { BuyerRfqRequest } from "@/types/rfq";

const COLUMNS = ["RFQ", "Product", "Quantity", "Target", "Submitted", "Quotes", "Status", "Action"];

export interface BuyerRfqTableProps {
  requests?: BuyerRfqRequest[];
  onCompare?: (rfq: BuyerRfqRequest) => void;
}

// List of RFQs the buyer has sent — the mirror of
// vendor/rfq/RfqTable.tsx's incoming-RFQ inbox. Instead of a "Quote"
// action (vendor responding to a buyer), the action here is "Compare
// Quotes" once at least one supplier has responded.
export default function BuyerRfqTable({ requests = [], onCompare }: BuyerRfqTableProps) {
  return (
    <Panel title={buyerRfqMeta.panelTitle}>
      <Table
        columns={COLUMNS}
        caption={buyerRfqMeta.panelTitle}
        emptyMessage="No RFQs match your search."
      >
        {requests.map((rfq) => (
          <tr key={rfq.id}>
            <td
              className={`px-4 py-3 font-heading font-semibold ${cellClassName({ emphasis: true })}`}
            >
              {rfq.id}
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>{rfq.product}</td>
            <td className={`px-4 py-3 ${cellClassName()}`}>{rfq.quantity}</td>
            <td
              className={`px-4 py-3 font-heading font-medium ${cellClassName()}`}
            >
              {rfq.target}
            </td>
            <td className={`px-4 py-3 ${cellClassName({ dim: true })}`}>
              {rfq.submitted}
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>
              {rfq.quotesReceived > 0 ? (
                <Badge tone="teal">{rfq.quotesReceived}</Badge>
              ) : (
                <span className="text-text-dim">{"\u2014"}</span>
              )}
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>
              <StatusPill status={rfq.status} />
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>
              <Button
                variant={rfq.quotesReceived > 0 ? "accent" : "ghost"}
                size="sm"
                onClick={() => onCompare?.(rfq)}
                disabled={!onCompare || rfq.quotesReceived === 0}
              >
                Compare
              </Button>
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}
