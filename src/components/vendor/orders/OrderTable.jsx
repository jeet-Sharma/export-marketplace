import colors from "@/theme/colors";
import Panel from "@/components/ui/Panel";
import Table, { cellStyle } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/vendor/StatusPill";
import { ordersMeta } from "@/data/orders";

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

// Action depends on where the order is in its lifecycle.
function actionFor(status) {
  if (status === "pending") return "Review";
  if (status === "processing") return "Update";
  if (status === "shipped") return "Track";
  if (status === "delivered") return "Invoice";
  return "View";
}

export default function OrderTable({ orders = [] }) {
  return (
    <Panel title={ordersMeta.panelTitle}>
      <Table columns={COLUMNS} emptyMessage="No orders match your search.">
        {orders.map((order) => (
          <tr key={order.id}>
            <td
              className="px-4 py-3 font-heading font-semibold"
              style={cellStyle({ color: colors.ink })}
            >
              {order.id}
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
              {order.product}
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
              <span>{order.buyer}</span>
              <span style={{ color: colors.textDim }}> ({order.country})</span>
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
              {order.quantity}
            </td>
            <td
              className="px-4 py-3 font-heading font-medium"
              style={cellStyle()}
            >
              {order.value}
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
              {order.incoterm}
            </td>
            <td
              className="px-4 py-3 font-body"
              style={cellStyle({ color: colors.textDim })}
            >
              {order.placed}
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
              <StatusPill status={order.status} />
            </td>
            <td className="px-4 py-3" style={cellStyle()}>
              <Button variant="ghost" size="sm">
                {actionFor(order.status)}
              </Button>
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}
