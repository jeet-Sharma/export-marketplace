'use client';

import { useMemo } from 'react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DataState from '@/components/buyer/DataState';
import NavIcon from '@/components/buyer/NavIcon';
import PageHeader from '@/components/buyer/PageHeader';
import SplitSection from '@/components/buyer/SplitSection';
import StatGrid from '@/components/buyer/StatGrid';
import { actionLabels, pageHeaders } from '@/data/seedData';
import api from '@/lib/api';
import { sortOrdersByRecency } from '@/lib/filterOrders';
import { sortRfqsByRecency } from '@/lib/filterRfqs';
import useCart from '@/lib/useCart';
import useResource from '@/lib/useResource';
import PaymentAlertBanner from './PaymentAlertBanner';
import RecentOrdersPanel from './RecentOrdersPanel';
import RfqSnapshotPanel from './RfqSnapshotPanel';
import useDashboardStats from './useDashboardStats';

/**
 * Buyer dashboard: headline figures, recent orders, open RFQs and any
 * outstanding payment.
 * @returns {import('react').ReactElement}
 */
export default function DashboardScreen() {
  const { data, loading, error, reload } = useResource(api.getDashboard);
  const { currencyCode } = useCart();
  const stats = useDashboardStats(data, currencyCode);

  const recentOrders = useMemo(
    () => (data ? sortOrdersByRecency(data.orders) : []),
    [data],
  );

  const openRfqs = useMemo(
    () => (data ? sortRfqsByRecency(data.rfqs).filter((rfq) => rfq.status !== 'closed') : []),
    [data],
  );

  const unpaidOrder = recentOrders.find((order) => order.status === 'payment-failed');

  return (
    <>
      <PageHeader
        title={pageHeaders.dashboard.title}
        breadcrumb={pageHeaders.dashboard.breadcrumb}
        actions={
          <>
            <Badge accent="teal" icon={<NavIcon name="check" size={12} />}>
              {actionLabels.kycVerified}
            </Badge>
            <Button href="/rfq" variant="accent" size="md">
              {actionLabels.newRfq}
            </Button>
          </>
        }
      />

      <DataState loading={loading} error={error} onRetry={reload}>
        <StatGrid stats={stats} />

        <SplitSection
          main={<RecentOrdersPanel orders={recentOrders} currencyCode={currencyCode} />}
          side={<RfqSnapshotPanel rfqs={openRfqs} currencyCode={currencyCode} />}
        />

        {unpaidOrder && (
          <PaymentAlertBanner order={unpaidOrder} currencyCode={currencyCode} />
        )}
      </DataState>
    </>
  );
}
