import Panel from "@/components/ui/Panel";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import BuyerOrderRow, {
  type BuyerOrderRowActionHandlers,
} from "@/components/buyer/dashboard/BuyerOrderRow";
import type { RecentBuyerOrder } from "@/types/order";

const COLUMNS = ["Order", "Product", "Supplier", "Status", "Action"];

export interface RecentBuyerOrdersTableProps extends BuyerOrderRowActionHandlers {
  orders?: RecentBuyerOrder[];
  title?: string;
  onViewAll?: () => void;
}

// Dashboard-only preview of the buyer's most recent orders — mirrors
// vendor/dashboard/RecentOrdersTable.tsx exactly, just reading the buyer's
// own order history instead of incoming orders. Full history lives at
// components/buyer/orders/BuyerOrderTable.tsx.
export default function RecentBuyerOrdersTable({
  orders = [],
  title = "Recent Orders",
  onViewAll,
  onTrack,
  onInvoice,
  onReorder,
}: RecentBuyerOrdersTableProps) {
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
          <BuyerOrderRow
            key={order.id}
            order={order}
            onTrack={onTrack}
            onInvoice={onInvoice}
            onReorder={onReorder}
          />
        ))}
      </Table>
    </Panel>
  );
}
