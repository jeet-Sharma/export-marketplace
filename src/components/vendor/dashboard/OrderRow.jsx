import Button from "@/components/ui/Button";
import { cellClassName } from "@/components/ui/Table";
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
  return (
    <tr>
      <td
        className={`px-4 py-3 font-heading font-semibold ${cellClassName({ emphasis: true })}`}
      >
        {order.id}
      </td>
      <td className={`px-4 py-3 ${cellClassName()}`}>{order.product}</td>
      <td className={`px-4 py-3 ${cellClassName()}`}>
        <span>{order.buyer}</span>
        <span className="text-text-dim"> ({order.country})</span>
      </td>
      <td className={`px-4 py-3 ${cellClassName()}`}>
        <StatusPill status={order.status} />
      </td>
      <td className={`px-4 py-3 ${cellClassName()}`}>
        <RowActions status={order.status} />
      </td>
    </tr>
  );
}
