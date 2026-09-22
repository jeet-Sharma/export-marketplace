'use client';

import Panel from '@/components/ui/Panel';
import CurrencySelect from '@/components/buyer/CurrencySelect';
import { shippingMethods } from '@/data/cart';
import cartTotals from '@/lib/cartTotals';
import formatMoney from '@/lib/formatMoney';
import useCart from '@/lib/useCart';
import OptionCard from './OptionCard';

/**
 * Shipping mode, payment method and settlement currency.
 *
 * @param {object} props
 * @param {import('@/lib/filterProducts').CatalogProduct[]} props.products
 * @param {import('@/data/profile').PaymentMethod[]} props.paymentMethods
 * @param {string} props.selectedPaymentMethodId
 * @param {(methodId: string) => void} props.onSelectPaymentMethod
 * @param {string} props.currencyCode
 * @returns {import('react').ReactElement}
 */
export default function ShippingPaymentStep({
  products,
  paymentMethods,
  selectedPaymentMethodId,
  onSelectPaymentMethod,
  currencyCode,
}) {
  const { lines, destinationCountry, shippingMethodId, setShippingMethodId } = useCart();

  // Each mode is priced against the current cart so the buyer compares real
  // freight figures rather than abstract multipliers.
  const freightByMethod = Object.fromEntries(
    shippingMethods.map((method) => [
      method.id,
      cartTotals({
        lines,
        products,
        destinationCountry,
        shippingMethodId: method.id,
      }),
    ]),
  );

  return (
    <>
      <Panel title="Shipping Method" description={`Freight to ${destinationCountry}.`}>
        <div className="space-y-2">
          {shippingMethods.map((method) => {
            const quote = freightByMethod[method.id];

            return (
              <OptionCard
                key={method.id}
                name="checkout-shipping"
                value={method.id}
                checked={method.id === shippingMethodId}
                onSelect={setShippingMethodId}
                title={method.label}
                description={
                  <>
                    {method.description}
                    {quote.transitDays !== null && ` · ${quote.transitDays} days transit`}
                  </>
                }
                meta={formatMoney(quote.freightUsd, currencyCode)}
              />
            );
          })}
        </div>
      </Panel>

      <Panel
        title="Payment Method"
        action={<CurrencySelect id="checkout-currency" labelHidden className="w-28" />}
      >
        <div className="space-y-2">
          {paymentMethods.map((method) => (
            <OptionCard
              key={method.id}
              name="checkout-payment"
              value={method.id}
              checked={method.id === selectedPaymentMethodId}
              onSelect={onSelectPaymentMethod}
              title={method.label}
              description={method.detail}
              meta={method.isDefault ? 'Default' : undefined}
            />
          ))}
        </div>
      </Panel>
    </>
  );
}
