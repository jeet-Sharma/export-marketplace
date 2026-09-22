import colors from "@/theme/colors";
import Panel from "@/components/ui/Panel";
import Table, { cellStyle } from "@/components/ui/Table";
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
      <Table columns={COLUMNS} emptyMessage="No RFQs match your search.">
        {requests.map((rfq) => (
          <tr key={rfq.id}>
            <td
              className="px-4 py-3 font-heading font-semibold"
              style={cellStyle({ color: colors.ink })}
            >
              {rfq.id}
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
              {rfq.product}
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
              <span>{rfq.buyer}</span>
              <span style={{ color: colors.textDim }}> ({rfq.country})</span>
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
              {rfq.quantity}
            </td>
            <td
              className="px-4 py-3 font-heading font-medium"
              style={cellStyle()}
            >
              {rfq.target}
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
              {rfq.incoterm}
            </td>
            <td
              className="px-4 py-3"
              style={cellStyle({ color: colors.textDim })}
            >
              {rfq.dueDate}
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
              <StatusPill status={rfq.status} />
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
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
