import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import DetailList from '@/components/buyer/DetailList';
import StatusPill from '@/components/buyer/StatusPill';
import { dashboardCopy } from '@/data/seedData';
import { formatQuantity } from '@/lib/formatCurrency';
import formatMoney from '@/lib/formatMoney';

/**
 * Compact RFQ card for the dashboard snapshot panel.
 *
 * @param {object} props
 * @param {import('@/lib/filterRfqs').RfqRecord} props.rfq
 * @param {string} props.currencyCode
 * @returns {import('react').ReactElement}
 */
export default function RfqSnapshotCard({ rfq, currencyCode }) {
  return (
    <article className="rounded-sharp border border-line p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/rfq/${rfq.id}`}
            className="font-heading text-sm font-semibold text-ink hover:text-saffron"
          >
            {rfq.id}
          </Link>
          <p className="mt-0.5 truncate text-xs text-textdim">
            {rfq.product?.name ?? rfq.productId}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          {rfq.hasNewQuote ? (
            <Badge accent="saffron">{dashboardCopy.newQuoteLabel}</Badge>
          ) : (
            <StatusPill status={rfq.status} />
          )}
        </div>
      </div>

      <DetailList
        className="mt-3"
        items={[
          {
            label: 'Quantity',
            value: rfq.product
              ? formatQuantity(rfq.quantity, rfq.product.unit)
              : String(rfq.quantity),
            numeric: true,
          },
          {
            label: 'Target Price',
            value: formatMoney(rfq.targetPriceUsd, currencyCode, { decimals: 2 }),
            numeric: true,
          },
          { label: 'Destination', value: rfq.destinationCountry },
        ]}
      />
    </article>
  );
}
