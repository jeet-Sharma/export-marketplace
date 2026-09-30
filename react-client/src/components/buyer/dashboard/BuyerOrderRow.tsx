import Button from "@/components/ui/Button";
import OrderRowShell from "@/components/shared/OrderRowShell";
import type { RecentBuyerOrder } from "@/types/order";

export interface BuyerOrderRowActionHandlers {
  onTrack?: (order: RecentBuyerOrder) => void;
  onInvoice?: (order: RecentBuyerOrder) => void;
  onReorder?: (order: RecentBuyerOrder) => void;
}

interface RowActionsProps extends BuyerOrderRowActionHandlers {
  order: RecentBuyerOrder;
  isActionPending?: boolean;
}

// Per-status row actions, from the buyer's side of the same order lifecycle
// vendor/dashboard/OrderRow.tsx renders: a buyer never accepts/rejects
// their own order (that's the vendor's action on the incoming order), so
// pending shows nothing actionable yet, shipped -> Track, delivered ->
// Invoice / Reorder.
function RowActions({ order, onTrack, onInvoice, onReorder, isActionPending }: RowActionsProps) {
  if (order.status === "shipped" || order.status === "processing") {
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
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onInvoice?.(order)}
          disabled={!onInvoice || isActionPending}
        >
          Invoice
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onReorder?.(order)}
          disabled={!onReorder || isActionPending}
        >
          Reorder
        </Button>
      </div>
    );
  }

  return null;
}

export interface BuyerOrderRowProps extends BuyerOrderRowActionHandlers {
  order: RecentBuyerOrder;
  isActionPending?: boolean;
}

export default function BuyerOrderRow({
  order,
  onTrack,
  onInvoice,
  onReorder,
  isActionPending,
}: BuyerOrderRowProps) {
  return (
    <OrderRowShell
      id={order.id}
      product={order.product}
      counterpartyName={order.supplier}
      country={order.country}
      status={order.status}
      actions={
        <RowActions
          order={order}
          onTrack={onTrack}
          onInvoice={onInvoice}
          onReorder={onReorder}
          isActionPending={isActionPending}
        />
      }
    />
  );
}
