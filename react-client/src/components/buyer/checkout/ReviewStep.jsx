import Panel from '@/components/ui/Panel';
import DetailList from '@/components/buyer/DetailList';
import formatMoney from '@/lib/formatMoney';
import DocumentChecklist from './DocumentChecklist';

/**
 * Final review: address, shipping/payment choice, totals and the document
 * checklist.
 *
 * @param {object} props
 * @param {import('@/data/profile').Address | undefined} props.address
 * @param {{ label: string, description: string } } props.shippingMethod
 * @param {import('@/data/profile').PaymentMethod | undefined} props.paymentMethod
 * @param {import('@/lib/cartTotals').CartTotals} props.totals
 * @param {string} props.currencyCode
 * @returns {import('react').ReactElement}
 */
export default function ReviewStep({ address, shippingMethod, paymentMethod, totals, currencyCode }) {
  return (
    <>
      <Panel title="Review Order">
        <DetailList
          variant="grid"
          items={[
            {
              label: 'Ship To',
              value: address
                ? `${address.label} · ${address.lines.join(', ')}, ${address.country}`
                : 'No address selected',
            },
            { label: 'Shipping Method', value: shippingMethod.label },
            { label: 'Payment Method', value: paymentMethod?.label ?? 'No method selected' },
            {
              label: 'Order Total',
              value: formatMoney(totals.totalUsd, currencyCode),
              numeric: true,
              strong: true,
            },
          ]}
        />
      </Panel>

      <DocumentChecklist />
    </>
  );
}
