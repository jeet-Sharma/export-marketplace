import Link from 'next/link';
import TableCell from '@/components/ui/TableCell';
import TableRow from '@/components/ui/TableRow';
import ProductIdentity from '@/components/buyer/ProductIdentity';
import StatusPill from '@/components/buyer/StatusPill';
import formatDate from '@/lib/formatDate';
import formatMoney from '@/lib/formatMoney';
import { formatQuantity } from '@/lib/formatCurrency';
import orderTotals from '@/lib/orderTotals';
import OrderActions from './OrderActions';

/**
 * Column set for any table of orders. The destination column is dropped in the
 * narrower dashboard panel.
 *
 * @param {{ showDestination?: boolean }} [options]
 * @returns {import('@/components/ui/Table').TableColumn[]}
 */
export function orderColumns({ showDestination = true } = {}) {
  return [
    { key: 'order', label: 'Order' },
    { key: 'product', label: 'Product' },
    ...(showDestination ? [{ key: 'destination', label: 'Destination' }] : []),
    { key: 'status', label: 'Status' },
    { key: 'total', label: 'Total', align: /** @type {const} */ ('right') },
    { key: 'action', label: 'Action', align: /** @type {const} */ ('right') },
  ];
}

/**
 * @param {object} props
 * @param {import('@/lib/filterOrders').OrderRecord} props.order
 * @param {string} props.currencyCode
 * @param {boolean} [props.showDestination]
 * @param {boolean} [props.last]
 * @returns {import('react').ReactElement}
 */
export default function OrderRow({ order, currencyCode, showDestination = true, last = false }) {
  const totals = orderTotals(order);

  return (
    <TableRow last={last}>
      <TableCell header numeric>
        <Link href={`/orders/${order.id}`} className="hover:text-saffron">
          {order.id}
        </Link>
        <span className="mt-0.5 block font-body text-[11px] font-normal text-textdim">
          {formatDate(order.milestones.placedOn)}
        </span>
      </TableCell>

      <TableCell>
        <ProductIdentity
          name={order.product?.name ?? order.productId}
          supplier={order.supplier}
          note={
            order.product ? formatQuantity(order.quantity, order.product.unit) : undefined
          }
          size="sm"
        />
      </TableCell>

      {showDestination && (
        <TableCell>
          <span className="block text-sm">{order.destination.city}</span>
          <span className="block text-[11px] text-textdim">{order.destination.country}</span>
        </TableCell>
      )}

      <TableCell>
        <StatusPill status={order.status} />
      </TableCell>

      <TableCell align="right" numeric>
        {formatMoney(totals.totalUsd, currencyCode)}
      </TableCell>

      <TableCell align="right">
        <OrderActions order={order} />
      </TableCell>
    </TableRow>
  );
}
