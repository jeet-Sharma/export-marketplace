import Panel from "@/components/ui/Panel";
import Table, { cellClassName } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/vendor/StatusPill";
import { ordersMeta } from "@/data/orders";
import { formatStatValue } from "@/lib/formatters";
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
          <tr key={order.id}>
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
            <td className={`px-4 py-3 ${cellClassName()}`}>{order.quantity}</td>
            <td
              className={`px-4 py-3 font-heading font-medium ${cellClassName()}`}
            >
              {formatStatValue(order.value, "currency")}
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>{order.incoterm}</td>
            <td className={`px-4 py-3 font-body ${cellClassName({ dim: true })}`}>
              {order.placed}
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>
              <StatusPill status={order.status} />
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRowAction?.(order)}
                disabled={!onRowAction}
              >
                {actionFor(order.status)}
              </Button>
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}
