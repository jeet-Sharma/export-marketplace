import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import CurrencySelect from '@/components/buyer/CurrencySelect';
import DetailList from '@/components/buyer/DetailList';
import NavIcon from '@/components/buyer/NavIcon';
import { cartCopy } from '@/data/cart';
import { actionLabels } from '@/data/seedData';
import formatMoney from '@/lib/formatMoney';

/**
 * Cart totals with the display-currency picker and the checkout entry point.
 *
 * @param {object} props
 * @param {import('@/lib/cartTotals').CartTotals} props.totals
 * @param {string} props.currencyCode
 * @param {boolean} [props.showCheckout]
 * @returns {import('react').ReactElement}
 */
export default function CartSummary({ totals, currencyCode, showCheckout = true }) {
  return (
    <Panel
      title="Cart Summary"
      action={<CurrencySelect id="cart-currency" labelHidden className="w-28" />}
      footer={
        showCheckout && (
          <div className="space-y-2">
            <Button href="/checkout" variant="accent" size="md" fullWidth>
              {actionLabels.proceedToCheckout}
            </Button>
            {totals.hasMoqIssue && (
              <p className="flex items-start gap-1 text-[11px] text-coral">
                <NavIcon name="alert" size={12} />
                {cartCopy.moqWarning} on one or more lines. Suppliers may decline the order.
              </p>
            )}
          </div>
        )
      }
    >
      <DetailList
        items={[
          {
            label: 'Subtotal',
            value: formatMoney(totals.subtotalUsd, currencyCode),
            numeric: true,
          },
          {
            label: `Shipping · ${totals.destination?.country ?? 'Not set'}`,
            value: formatMoney(totals.freightUsd, currencyCode),
            numeric: true,
          },
          {
            label: 'Estimated Duties',
            value: formatMoney(totals.dutiesUsd, currencyCode),
            numeric: true,
          },
          {
            label: 'Total',
            value: formatMoney(totals.totalUsd, currencyCode),
            numeric: true,
            strong: true,
          },
        ]}
      />
    </Panel>
  );
}
