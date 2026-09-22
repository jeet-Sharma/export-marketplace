import Button from '@/components/ui/Button';
import { actionLabels } from '@/data/seedData';

/**
 * Row actions for an order, chosen by status:
 * in transit → track, delivered → reorder and invoice, failed payment → settle,
 * anything else → open the order.
 *
 * @param {object} props
 * @param {import('@/lib/filterOrders').OrderRecord} props.order
 * @returns {import('react').ReactElement}
 */
export default function OrderActions({ order }) {
  const detailHref = `/orders/${order.id}`;

  if (order.status === 'in-transit') {
    return (
      <Button href={detailHref} variant="ghost">
        {actionLabels.track}
      </Button>
    );
  }

  if (order.status === 'delivered') {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <Button variant="ghost">{actionLabels.reorder}</Button>
        <Button variant="subtle">{actionLabels.invoice}</Button>
      </div>
    );
  }

  if (order.status === 'payment-failed') {
    return <Button variant="danger">{actionLabels.payNow}</Button>;
  }

  return (
    <Button href={detailHref} variant="subtle">
      {actionLabels.view}
    </Button>
  );
}
