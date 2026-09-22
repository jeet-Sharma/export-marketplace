import colors from "@/theme/colors";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import OrderRow from "@/components/vendor/dashboard/OrderRow";

const COLUMNS = ["Order", "Product", "Buyer", "Status", "Action"];

export default function OrdersTable({ orders = [], title = "Recent Orders" }) {
  return (
    <Panel
      title={title}
      action={
        <Button variant="ghost" size="sm">
          View all orders
        </Button>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column}
                  className="px-4 py-2 font-body font-medium"
                  style={{
                    color: colors.textDim,
                    backgroundColor: colors.paper,
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
