'use client';

import Panel from '@/components/ui/Panel';
import Select from '@/components/ui/Select';
import DetailList from '@/components/buyer/DetailList';
import { shippingDestinations } from '@/data/cart';
import formatMoney from '@/lib/formatMoney';
import useCart from '@/lib/useCart';

/**
 * Destination picker with the resulting freight estimate.
 *
 * @param {object} props
 * @param {import('@/lib/cartTotals').CartTotals} props.totals
 * @param {string} props.currencyCode
 * @returns {import('react').ReactElement}
 */
export default function ShippingCalculator({ totals, currencyCode }) {
  const { destinationCountry, setDestinationCountry } = useCart();

  return (
    <Panel
      title="Shipping Cost Calculator"
      description="Indicative freight based on gross weight and destination."
    >
      <Select
        id="cart-destination"
        label="Destination Country"
        value={destinationCountry}
        onChange={setDestinationCountry}
        options={shippingDestinations.map((destination) => ({
          value: destination.country,
          label: destination.country,
        }))}
      />

      <DetailList
        className="mt-3"
        items={[
          {
            label: 'Gross Weight',
            value: `${totals.weightKg.toFixed(1)} kg`,
            numeric: true,
          },
          {
            label: 'Mode',
            value: totals.shippingMethod.label,
          },
          {
            label: 'Transit Estimate',
            value: totals.transitDays === null ? '—' : `${totals.transitDays} days`,
            numeric: true,
          },
          {
            label: 'Estimated Freight',
            value: formatMoney(totals.freightUsd, currencyCode),
            numeric: true,
            strong: true,
          },
        ]}
      />
    </Panel>
  );
}
