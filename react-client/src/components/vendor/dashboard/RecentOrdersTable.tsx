import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import OrderRow, { type OrderRowActionHandlers } from "@/components/vendor/dashboard/OrderRow";
import type { RecentOrder } from "@/types/order";

const COLUMNS = ["Order", "Product", "Buyer", "Status", "Action"];

export interface RecentOrdersTableProps extends OrderRowActionHandlers {
  orders?: RecentOrder[];
  title?: string;
  onViewAll?: () => void;
}

// Dashboard-only preview of the most recent orders. Not the full order
// book — see components/vendor/orders/OrderTable.jsx for that (more
// columns, search/filter, lifecycle-aware actions).
export default function RecentOrdersTable({
  orders = [],
  title = "Recent Orders",
  onViewAll,
  onAccept,
  onReject,
  onTrack,
  onInvoice,
}: RecentOrdersTableProps) {
  return (
    <Panel
      title={title}
      action={
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          View all orders
        </Button>
      }
    >
      <Table columns={COLUMNS} caption={title}>
        {orders.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            onAccept={onAccept}
            onReject={onReject}
            onTrack={onTrack}
            onInvoice={onInvoice}
          />
        ))}
      </Table>
    </Panel>
  );
}
