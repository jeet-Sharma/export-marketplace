'use client';

import { useMemo, useState } from 'react';
import Panel from '@/components/ui/Panel';
import DataState from '@/components/buyer/DataState';
import EmptyState from '@/components/buyer/EmptyState';
import FilterTabs from '@/components/buyer/FilterTabs';
import PageHeader from '@/components/buyer/PageHeader';
import StatGrid from '@/components/buyer/StatGrid';
import TableToolbar from '@/components/buyer/TableToolbar';
import { orderStatusFilters } from '@/data/orders';
import { pageHeaders, statLabels } from '@/data/seedData';
import api from '@/lib/api';
import filterOrders, { sortOrdersByRecency } from '@/lib/filterOrders';
import formatMoney from '@/lib/formatMoney';
import orderStats from '@/lib/orderStats';
import useCart from '@/lib/useCart';
import useResource from '@/lib/useResource';
import OrdersTable from './OrdersTable';

/**
 * Order history with live search and status tabs.
 * @returns {import('react').ReactElement}
 */
export default function OrdersScreen() {
  const { data, loading, error, reload } = useResource(api.getOrders);
  const { currencyCode } = useCart();

  const [query, setQuery] = useState('');
  const [statusFilterId, setStatusFilterId] = useState(orderStatusFilters[0].id);

  const orders = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    const counts = orderStats(orders);

    return [
      { id: 'active', label: statLabels.activeOrders, value: String(counts.active) },
      { id: 'delivered', label: statLabels.delivered, value: String(counts.delivered) },
      {
        id: 'spend',
        label: statLabels.totalSpend,
        value: formatMoney(counts.totalSpendUsd, currencyCode),
      },
      {
        id: 'payment-issues',
        label: statLabels.paymentIssues,
        value: String(counts.paymentIssues),
        valueAccent: /** @type {const} */ ('coral'),
      },
    ];
  }, [orders, currencyCode]);

  const tabCounts = useMemo(
    () =>
      Object.fromEntries(
        orderStatusFilters.map((filter) => [
          filter.id,
          filter.status
            ? orders.filter((order) => order.status === filter.status).length
            : orders.length,
        ]),
      ),
    [orders],
  );

  const visibleOrders = useMemo(() => {
    const status =
      orderStatusFilters.find((filter) => filter.id === statusFilterId)?.status ?? null;
    return sortOrdersByRecency(filterOrders(orders, { query, status }));
  }, [orders, query, statusFilterId]);

  return (
    <>
      <PageHeader
        title={pageHeaders.orders.title}
        breadcrumb={pageHeaders.orders.breadcrumb}
      />

      <StatGrid stats={stats} />

      <Panel title="Order History" padded={false}>
        <TableToolbar
          searchId="order-search"
          searchLabel="Search orders"
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search order ID, product or country..."
          summary={`${visibleOrders.length} of ${orders.length} orders`}
          tabs={
            <FilterTabs
              label="Filter orders by status"
              tabs={orderStatusFilters}
              activeId={statusFilterId}
              onChange={setStatusFilterId}
              counts={tabCounts}
            />
          }
        />

        <DataState
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={visibleOrders.length === 0}
          skeletonRows={6}
          empty={
            <EmptyState
              icon="orders"
              title="No orders match your filters"
              description="Clear the search or pick a different status."
            />
          }
        >
          <OrdersTable
            orders={visibleOrders}
            currencyCode={currencyCode}
            caption="Full order history"
          />
        </DataState>
      </Panel>
    </>
  );
}
