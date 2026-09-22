'use client';

import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import DataState from '@/components/buyer/DataState';
import DetailList from '@/components/buyer/DetailList';
import PageHeader from '@/components/buyer/PageHeader';
import ProductIdentity from '@/components/buyer/ProductIdentity';
import StatusPill from '@/components/buyer/StatusPill';
import { pageHeaders } from '@/data/seedData';
import api from '@/lib/api';
import { formatQuantity } from '@/lib/formatCurrency';
import formatDate, { formatDays } from '@/lib/formatDate';
import formatMoney from '@/lib/formatMoney';
import useCart from '@/lib/useCart';
import useResource from '@/lib/useResource';
import QuoteCompareTable from './QuoteCompareTable';

/**
 * Single RFQ: the request summary plus the quote comparison table.
 *
 * @param {object} props
 * @param {string} props.rfqId
 * @returns {import('react').ReactElement}
 */
export default function RfqDetailScreen({ rfqId }) {
  const { data: rfq, loading, error, reload } = useResource(api.getRfq, rfqId);
  const { currencyCode } = useCart();

  return (
    <>
      <PageHeader
        title={`Request ${rfqId}`}
        breadcrumb={pageHeaders.rfqDetail.breadcrumb}
        meta={rfq && <StatusPill status={rfq.status} />}
        actions={
          <Button href="/rfq" variant="subtle" size="md">
            Back to RFQs
          </Button>
        }
      />

      <DataState loading={loading} error={error} onRetry={reload} skeletonRows={6}>
        {rfq && (
          <>
            <Panel title="Request Summary">
              <ProductIdentity
                name={rfq.product?.name ?? rfq.productId}
                note={rfq.product?.category}
                size="lg"
              />

              <DetailList
                className="mt-4"
                variant="grid"
                items={[
                  {
                    label: 'Quantity',
                    value: formatQuantity(rfq.quantity, rfq.product?.unit ?? 'units'),
                    numeric: true,
                  },
                  {
                    label: 'Target Price',
                    value: formatMoney(rfq.targetPriceUsd, currencyCode, { decimals: 2 }),
                    numeric: true,
                  },
                  { label: 'Destination', value: rfq.destinationCountry },
                  { label: 'Created', value: formatDate(rfq.createdOn), numeric: true },
                  {
                    label: 'First Response',
                    value:
                      rfq.firstResponseDays === null
                        ? 'Awaiting first quote'
                        : formatDays(rfq.firstResponseDays),
                  },
                  { label: 'Quotes Received', value: String(rfq.quotes.length), numeric: true },
                ]}
              />

              {rfq.notes && (
                <div className="mt-4 border-t border-line pt-3">
                  <h3 className="text-[11px] font-medium uppercase tracking-wide text-textdim">
                    Notes
                  </h3>
                  <p className="mt-1 text-sm text-text">{rfq.notes}</p>
                </div>
              )}
            </Panel>

            <Panel
              title="Quote Comparison"
              description="Lowest unit price is highlighted."
              padded={false}
            >
              <QuoteCompareTable
                quotes={rfq.quotes}
                unit={rfq.product?.unit ?? 'units'}
                currencyCode={currencyCode}
                acceptedQuoteId={rfq.acceptedQuoteId}
              />
            </Panel>
          </>
        )}
      </DataState>
    </>
  );
}
