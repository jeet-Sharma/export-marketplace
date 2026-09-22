import colors from "@/theme/colors";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/vendor/StatusPill";

// Per-status row actions:
// pending -> Accept / Reject, shipped -> Track, delivered -> Invoice
function RowActions({ status }) {
  if (status === "pending") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm">
          Accept
        </Button>
        <Button variant="danger" size="sm">
          Reject
        </Button>
      </div>
    );
  }

  if (status === "shipped") {
    return (
      <Button variant="ghost" size="sm">
        Track
      </Button>
    );
  }

  if (status === "delivered") {
    return (
      <Button variant="ghost" size="sm">
        Invoice
      </Button>
    );
  }

  return null;
}

export default function OrderRow({ order }) {
  const cellStyle = {
    borderTop: `1px solid ${colors.line}`,
    fontSize: "13px",
    color: colors.text,
  };

  return (
    <tr>
      <td
        className="px-4 py-3 font-heading font-semibold"
        style={{ ...cellStyle, color: colors.ink }}
      >
        {order.id}
      </td>
      <td className="px-4 py-3" style={cellStyle}>
        {order.product}
      </td>
      <td className="px-4 py-3" style={cellStyle}>
        <span>{order.buyer}</span>
        <span style={{ color: colors.textDim }}> ({order.country})</span>
      </td>
      <td className="px-4 py-3" style={cellStyle}>
        <StatusPill status={order.status} />
      </td>
      <td className="px-4 py-3" style={cellStyle}>
        <RowActions status={order.status} />
      </td>
    </tr>
  );
}
