import Panel from "@/components/ui/Panel";
import Table, { cellClassName } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { buyerRfqMeta } from "@/data/buyerRfq";
import type { BuyerRfqRequest, SupplierQuote } from "@/types/rfq";

const COLUMNS = ["Supplier", "Price", "Delivery", "Select"];

export interface CompareQuotesPanelProps {
  rfq: BuyerRfqRequest | null;
  quotes: SupplierQuote[];
  onChoose?: (quote: SupplierQuote) => void;
}

// Side panel for the RFQ the buyer selected to compare — the buyer-side
// counterpart to vendor/rfq/QuoteForm.tsx (which composes a quote instead
// of comparing received ones). Matches the platform doc's "Compare
// Quotes" spec: supplier / price / delivery / choose.
export default function CompareQuotesPanel({ rfq, quotes, onChoose }: CompareQuotesPanelProps) {
  if (!rfq) {
    return (
      <Panel title={buyerRfqMeta.compareTitle} bodyClassName="p-4">
        <p className="font-body text-text-dim text-[13px]">
          Pick an RFQ with quotes to compare supplier offers.
        </p>
      </Panel>
    );
  }

  return (
    <Panel title={buyerRfqMeta.compareTitle} bodyClassName="p-0">
      <div className="flex flex-col gap-1 p-4 border-b border-line">
        <span className="font-heading font-semibold text-ink text-[13px]">
          {rfq.id} {"\u00B7"} {rfq.product}
        </span>
        <span className="font-body text-text-dim text-[12px]">
          {rfq.quantity} {"\u00B7"} target {rfq.target}
        </span>
      </div>

      <Table columns={COLUMNS} caption={buyerRfqMeta.compareTitle} emptyMessage="No quotes yet.">
        {quotes.map((quote) => (
          <tr key={quote.id}>
            <td className={`px-4 py-3 ${cellClassName({ emphasis: true })}`}>
              <span>{quote.supplierName}</span>
              {quote.supplierVerified && (
                <Badge tone="teal" className="ml-2">
                  {"\u2713"}
                </Badge>
              )}
            </td>
            <td
              className={`px-4 py-3 font-heading font-medium ${cellClassName()}`}
            >
              {quote.price}
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>{quote.delivery}</td>
            <td className={`px-4 py-3 ${cellClassName()}`}>
              <Button
                variant="accent"
                size="sm"
                onClick={() => onChoose?.(quote)}
                disabled={!onChoose}
              >
                Choose
              </Button>
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}
