import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import EmptyState from '@/components/buyer/EmptyState';
import OrdersTable from '@/components/buyer/orders/OrdersTable';
import { actionLabels, dashboardCopy, dashboardLimits } from '@/data/seedData';

/**
 * @param {object} props
 * @param {import('@/lib/filterOrders').OrderRecord[]} props.orders Already sorted.
 * @param {string} props.currencyCode
 * @returns {import('react').ReactElement}
 */
export default function RecentOrdersPanel({ orders, currencyCode }) {
  const visibleOrders = orders.slice(0, dashboardLimits.recentOrders);

  return (
    <Panel
      title={dashboardCopy.recentOrdersTitle}
      action={
        <Button href="/orders" variant="subtle">
          {actionLabels.view} all
        </Button>
      }
      padded={false}
    >
      {visibleOrders.length ? (
        <OrdersTable
          orders={visibleOrders}
          currencyCode={currencyCode}
          showDestination={false}
          caption="Most recent orders"
        />
      ) : (
        <EmptyState
          icon="orders"
          title="No orders yet"
          description="Your orders will appear here once you check out."
        />
      )}
    </Panel>
  );
}
