import Button from '@/components/ui/Button';
import NavIcon from '@/components/buyer/NavIcon';
import { actionLabels, dashboardCopy } from '@/data/seedData';
import formatMoney from '@/lib/formatMoney';
import orderTotals from '@/lib/orderTotals';

/**
 * Coral banner shown while an order still has an unsettled payment.
 *
 * @param {object} props
 * @param {import('@/lib/filterOrders').OrderRecord} props.order
 * @param {string} props.currencyCode
 * @returns {import('react').ReactElement}
 */
export default function PaymentAlertBanner({ order, currencyCode }) {
  const { totalUsd } = orderTotals(order);

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-sharp border border-coral bg-coral-soft p-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-coral">
          <NavIcon name="alert" size={18} />
        </span>
        <div>
          <p className="font-heading text-sm font-semibold text-coral">
            {dashboardCopy.paymentAlertTitle} · {order.id}
          </p>
          <p className="mt-0.5 text-xs text-text">
            {dashboardCopy.paymentAlertDescription} Outstanding{' '}
            {formatMoney(totalUsd, currencyCode)}.
          </p>
        </div>
      </div>

      <Button variant="danger" size="md" className="sm:shrink-0">
        {actionLabels.payNow}
      </Button>
    </div>
  );
}
