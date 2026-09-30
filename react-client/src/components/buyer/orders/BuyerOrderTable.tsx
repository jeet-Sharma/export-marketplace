import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import OrderTableRowShell from "@/components/shared/OrderTableRowShell";
import { buyerOrdersMeta } from "@/data/buyerOrders";
import type { BuyerOrder } from "@/types/order";

const COLUMNS = [
  "Order",
  "Product",
  "Supplier",
  "Quantity",
  "Value",
  "Incoterm",
  "Placed",
  "Status",
  "Action",
];

// Action label depends on where the buyer's order is in its lifecycle —
// mirrors vendor/orders/OrderTable.tsx's actionFor, but from the buying
// side: a buyer tracks/downloads their own order rather than
// reviewing/updating someone else's.
function actionFor(status: BuyerOrder["status"]): string {
  if (status === "pending") return "View";
  if (status === "processing") return "Track";
  if (status === "shipped") return "Track";
  if (status === "delivered") return "Invoice";
  return "View";
}

export interface BuyerOrderTableProps {
  orders?: BuyerOrder[];
  onRowAction?: (order: BuyerOrder) => void;
}

export default function BuyerOrderTable({ orders = [], onRowAction }: BuyerOrderTableProps) {
  return (
    <Panel title={buyerOrdersMeta.panelTitle}>
      <Table
        columns={COLUMNS}
        caption={buyerOrdersMeta.panelTitle}
        emptyMessage="No orders match your search."
      >
        {orders.map((order) => (
          <OrderTableRowShell
            key={order.id}
            id={order.id}
            product={order.product}
            counterpartyName={order.supplier}
            country={order.country}
            quantity={order.quantity}
            value={order.value}
            incoterm={order.incoterm}
            placed={order.placed}
            status={order.status}
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRowAction?.(order)}
                disabled={!onRowAction}
              >
                {actionFor(order.status)}
              </Button>
            }
          />
        ))}
      </Table>
    </Panel>
  );
}
