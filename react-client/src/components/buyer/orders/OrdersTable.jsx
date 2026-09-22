import Table from '@/components/ui/Table';
import OrderRow, { orderColumns } from './OrderRow';

/**
 * @param {object} props
 * @param {import('@/lib/filterOrders').OrderRecord[]} props.orders
 * @param {string} props.currencyCode
 * @param {boolean} [props.showDestination]
 * @param {string} props.caption
 * @returns {import('react').ReactElement}
 */
export default function OrdersTable({
  orders,
  currencyCode,
  showDestination = true,
  caption,
}) {
  return (
    <Table columns={orderColumns({ showDestination })} caption={caption}>
      {orders.map((order, index) => (
        <OrderRow
          key={order.id}
          order={order}
          currencyCode={currencyCode}
          showDestination={showDestination}
          last={index === orders.length - 1}
        />
      ))}
    </Table>
  );
}
