import Panel from "@/components/ui/Panel";
import Table, { cellClassName } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/vendor/StatusPill";
import { rfqMeta } from "@/data/rfq";

const COLUMNS = [
  "RFQ",
  "Product",
  "Buyer",
  "Quantity",
  "Target",
  "Incoterm",
  "Due",
  "Status",
  "Action",
];

export default function RfqTable({ requests = [], onQuote }) {
  return (
    <Panel title={rfqMeta.panelTitle}>
      <Table
        columns={COLUMNS}
        caption={rfqMeta.panelTitle}
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
            <td className={`px-4 py-3 ${cellClassName()}`}>
              <span>{rfq.buyer}</span>
              <span className="text-text-dim"> ({rfq.country})</span>
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>{rfq.quantity}</td>
            <td
              className={`px-4 py-3 font-heading font-medium ${cellClassName()}`}
            >
              {rfq.target}
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>{rfq.incoterm}</td>
            <td className={`px-4 py-3 ${cellClassName({ dim: true })}`}>
              {rfq.dueDate}
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>
              <StatusPill status={rfq.status} />
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>
              {rfq.status === "open" ? (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={onQuote ? () => onQuote(rfq) : undefined}
                >
                  Quote
                </Button>
              ) : (
                <Button variant="ghost" size="sm">
                  View
                </Button>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}
