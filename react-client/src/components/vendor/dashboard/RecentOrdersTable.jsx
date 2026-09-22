import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import OrderRow from "@/components/vendor/dashboard/OrderRow";

const COLUMNS = ["Order", "Product", "Buyer", "Status", "Action"];

// Dashboard-only preview of the most recent orders. Not the full order
// book — see components/vendor/orders/OrderTable.jsx for that (more
// columns, search/filter, lifecycle-aware actions).
export default function RecentOrdersTable({
  orders = [],
  title = "Recent Orders",
}) {
  return (
    <Panel
      title={title}
      action={
        <Button variant="ghost" size="sm">
          View all orders
        </Button>
      }
    >
      <Table columns={COLUMNS} caption={title}>
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
      </Table>
    </Panel>
  );
}
