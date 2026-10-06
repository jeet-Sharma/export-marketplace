import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import OrderTableRowShell from "@/components/shared/OrderTableRowShell";
import { ordersMeta } from "@/data/orders";
import type { Order } from "@/types/order";

const COLUMNS = [
  "Order",
  "Product",
  "Buyer",
  "Quantity",
  "Value",
  "Incoterm",
  "Placed",
  "Status",
  "Action",
];

// Action label depends on where the order is in its lifecycle.
function actionFor(status: Order["status"]): string {
  if (status === "pending") return "Review";
  if (status === "processing") return "Update";
  if (status === "shipped") return "Track";
  if (status === "delivered") return "Invoice";
  return "View";
}

export interface OrderTableProps {
  orders?: Order[];
  onRowAction?: (order: Order) => void;
}

export default function OrderTable({ orders = [], onRowAction }: OrderTableProps) {
  return (
    <Panel title={ordersMeta.panelTitle}>
      <Table
        columns={COLUMNS}
        caption={ordersMeta.panelTitle}
        emptyMessage="No orders match your search."
      >
        {orders.map((order) => (
          <OrderTableRowShell
            key={order.id}
            id={order.id}
            product={order.product}
            counterpartyName={order.buyer}
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
