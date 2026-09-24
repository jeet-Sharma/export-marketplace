import Button from "@/components/ui/Button";
import { cellClassName } from "@/components/ui/Table";
import StatusPill from "@/components/vendor/StatusPill";
import type { RecentOrder } from "@/types/order";

export interface OrderRowActionHandlers {
  onAccept?: (order: RecentOrder) => void;
  onReject?: (order: RecentOrder) => void;
  onTrack?: (order: RecentOrder) => void;
  onInvoice?: (order: RecentOrder) => void;
}

interface RowActionsProps extends OrderRowActionHandlers {
  order: RecentOrder;
  /** Disables the visible action button(s) while a request is in flight. */
  isActionPending?: boolean;
}

// Per-status row actions:
// pending -> Accept / Reject, shipped -> Track, delivered -> Invoice
//
// Handlers are optional so OrderRow stays usable in read-only contexts
// (e.g. a future audit log) without every caller having to pass no-ops.
// Buttons are disabled whenever their handler is missing (nothing useful
// would happen on click) or while isActionPending is true.
function RowActions({ order, onAccept, onReject, onTrack, onInvoice, isActionPending }: RowActionsProps) {
  if (order.status === "pending") {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onAccept?.(order)}
          disabled={!onAccept || isActionPending}
        >
          Accept
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onReject?.(order)}
          disabled={!onReject || isActionPending}
        >
          Reject
        </Button>
      </div>
    );
  }

  if (order.status === "shipped") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onTrack?.(order)}
        disabled={!onTrack || isActionPending}
      >
        Track
      </Button>
    );
  }

  if (order.status === "delivered") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onInvoice?.(order)}
        disabled={!onInvoice || isActionPending}
      >
        Invoice
      </Button>
    );
  }

  return null;
}

export interface OrderRowProps extends OrderRowActionHandlers {
  order: RecentOrder;
  isActionPending?: boolean;
}

export default function OrderRow({
  order,
  onAccept,
  onReject,
  onTrack,
  onInvoice,
  isActionPending,
}: OrderRowProps) {
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
        <RowActions
          order={order}
          onAccept={onAccept}
          onReject={onReject}
          onTrack={onTrack}
          onInvoice={onInvoice}
          isActionPending={isActionPending}
        />
      </td>
    </tr>
  );
}
