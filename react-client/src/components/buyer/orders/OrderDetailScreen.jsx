'use client';

import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import DataState from '@/components/buyer/DataState';
import DetailList from '@/components/buyer/DetailList';
import NavIcon from '@/components/buyer/NavIcon';
import PageHeader from '@/components/buyer/PageHeader';
import ProductIdentity from '@/components/buyer/ProductIdentity';
import SplitSection from '@/components/buyer/SplitSection';
import StatusPill from '@/components/buyer/StatusPill';
import { actionLabels, pageHeaders } from '@/data/seedData';
import api from '@/lib/api';
import { formatQuantity } from '@/lib/formatCurrency';
import formatDate from '@/lib/formatDate';
import formatMoney, { formatUnitMoney } from '@/lib/formatMoney';
import orderTimeline from '@/lib/orderTimeline';
import orderTotals from '@/lib/orderTotals';
import useCart from '@/lib/useCart';
import useResource from '@/lib/useResource';
import TrackingTimeline from './TrackingTimeline';

/**
 * Single order: summary, cost breakdown, tracking timeline and payment state.
 *
 * @param {object} props
 * @param {string} props.orderId
 * @returns {import('react').ReactElement}
 */
export default function OrderDetailScreen({ orderId }) {
  const { data: order, loading, error, reload } = useResource(api.getOrder, orderId);
  const { currencyCode } = useCart();

  const totals = order ? orderTotals(order) : null;
  const isPaid = order?.paymentStatus === 'paid';

  return (
    <>
      <PageHeader
        title={`Order ${orderId}`}
        breadcrumb={pageHeaders.orderDetail.breadcrumb}
        meta={order && <StatusPill status={order.status} />}
        actions={
          <>
            <Button href="/orders" variant="subtle" size="md">
              Back to orders
            </Button>
            <Button variant="ghost" size="md">
              {actionLabels.contactSupplier}
            </Button>
          </>
        }
      />

      <DataState loading={loading} error={error} onRetry={reload} skeletonRows={8}>
        {order && totals && (
          <SplitSection
            main={
              <>
                <Panel title="Order Summary">
                  <ProductIdentity
                    name={order.product?.name ?? order.productId}
                    supplier={order.supplier}
                    note={order.product?.category}
                    size="lg"
                  />

                  <DetailList
                    className="mt-4"
                    variant="grid"
                    items={[
                      {
                        label: 'Quantity',
                        value: order.product
                          ? formatQuantity(order.quantity, order.product.unit)
                          : String(order.quantity),
                        numeric: true,
                      },
                      {
                        label: 'Agreed Unit Price',
                        value: order.product
                          ? formatUnitMoney(
                              order.unitPriceUsd,
                              order.product.unit,
                              currencyCode,
                            )
                          : formatMoney(order.unitPriceUsd, currencyCode, { decimals: 2 }),
                        numeric: true,
                      },
                      { label: 'Incoterm', value: order.incoterm },
                      {
                        label: 'Destination',
                        value: `${order.destination.city}, ${order.destination.country}`,
                      },
                      {
                        label: 'Placed On',
                        value: formatDate(order.milestones.placedOn),
                        numeric: true,
                      },
                      {
                        label: 'Expected',
                        value: formatDate(order.expectedOn),
                        numeric: true,
                      },
                      { label: 'Carrier', value: order.carrier ?? 'Not assigned' },
                      {
                        label: 'Tracking Number',
                        value: order.trackingNumber ?? 'Issued at dispatch',
                        numeric: Boolean(order.trackingNumber),
                      },
                    ]}
                  />
                </Panel>

                <Panel title="Cost Breakdown">
                  <DetailList
                    items={[
                      {
                        label: 'Goods Value',
                        value: formatMoney(totals.goodsUsd, currencyCode),
                        numeric: true,
                      },
                      {
                        label: 'Freight',
                        value: formatMoney(totals.freightUsd, currencyCode),
                        numeric: true,
                      },
                      {
                        label: 'Duties & Taxes',
                        value: formatMoney(totals.dutiesUsd, currencyCode),
                        numeric: true,
                      },
                      {
                        label: 'Order Total',
                        value: formatMoney(totals.totalUsd, currencyCode),
                        numeric: true,
                        strong: true,
                      },
                    ]}
                  />
                </Panel>
              </>
            }
            side={
              <>
                <Panel title="Shipment Tracking">
                  <TrackingTimeline stages={orderTimeline(order)} />
                </Panel>

                <Panel title="Payment">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-textdim">Payment status</span>
                    <StatusPill status={order.paymentStatus} />
                  </div>

                  <div className="mt-3 space-y-2">
                    <Button variant="ghost" size="md" fullWidth disabled={!isPaid}>
                      <NavIcon name="download" size={14} />
                      Download Invoice
                    </Button>

                    {!isPaid && (
                      <>
                        <p className="text-[11px] text-textdim">
                          The commercial invoice is issued once payment clears.
                        </p>
                        <Button variant="danger" size="md" fullWidth>
                          {actionLabels.payNow}
                        </Button>
                      </>
                    )}
                  </div>
                </Panel>
              </>
            }
          />
        )}
      </DataState>
    </>
  );
}
