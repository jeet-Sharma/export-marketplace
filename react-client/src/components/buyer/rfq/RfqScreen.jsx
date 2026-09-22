'use client';

import { useMemo, useState } from 'react';
import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import DataState from '@/components/buyer/DataState';
import EmptyState from '@/components/buyer/EmptyState';
import FilterTabs from '@/components/buyer/FilterTabs';
import PageHeader from '@/components/buyer/PageHeader';
import StatGrid from '@/components/buyer/StatGrid';
import TableToolbar from '@/components/buyer/TableToolbar';
import { shippingDestinations } from '@/data/cart';
import { rfqStatusFilters } from '@/data/rfq';
import { actionLabels, pageHeaders, statLabels } from '@/data/seedData';
import api from '@/lib/api';
import filterRfqs, { sortRfqsByRecency } from '@/lib/filterRfqs';
import { formatDays } from '@/lib/formatDate';
import rfqStats from '@/lib/rfqStats';
import useCart from '@/lib/useCart';
import useResource from '@/lib/useResource';
import useRfqList from '@/lib/useRfqList';
import NewRfqForm from './NewRfqForm';
import RfqTable from './RfqTable';

const destinationCountries = shippingDestinations.map((destination) => destination.country);

/**
 * RFQ list with live search, status tabs and inline quote comparison.
 * @returns {import('react').ReactElement}
 */
export default function RfqScreen() {
  const { rfqs, loading, error, reload, submitRfq } = useRfqList();
  const { data: products } = useResource(api.getProducts);
  const { currencyCode } = useCart();

  const [formOpen, setFormOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilterId, setStatusFilterId] = useState(rfqStatusFilters[0].id);

  const stats = useMemo(() => {
    const counts = rfqStats(rfqs);

    return [
      { id: 'open', label: statLabels.openRfqs, value: String(counts.open) },
      { id: 'quoted', label: statLabels.quoted, value: String(counts.quoted) },
      { id: 'closed', label: statLabels.closed, value: String(counts.closed) },
      {
        id: 'response',
        label: statLabels.avgResponseTime,
        value: counts.avgResponseDays === null ? '—' : formatDays(counts.avgResponseDays),
      },
    ];
  }, [rfqs]);

  const visibleRfqs = useMemo(() => {
    const status =
      rfqStatusFilters.find((filter) => filter.id === statusFilterId)?.status ?? null;
    return sortRfqsByRecency(filterRfqs(rfqs, { query, status }));
  }, [rfqs, query, statusFilterId]);

  /** @param {import('@/lib/useRfqList').NewRfqInput} input */
  const handleSubmit = (input) => {
    submitRfq(input);
    setFormOpen(false);

    // Clear filters so the new request is visible straight away.
    setQuery('');
    setStatusFilterId(rfqStatusFilters[0].id);
  };

  return (
    <>
      <PageHeader
        title={pageHeaders.rfq.title}
        breadcrumb={pageHeaders.rfq.breadcrumb}
        actions={
          <Button
            variant="accent"
            size="md"
            onClick={() => setFormOpen((open) => !open)}
            pressed={formOpen}
          >
            {actionLabels.newRfq}
          </Button>
        }
      />

      <StatGrid stats={stats} />

      {formOpen && (
        <NewRfqForm
          products={products ?? []}
          destinations={destinationCountries}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      )}

      <Panel title="My RFQs" padded={false}>
        <TableToolbar
          searchId="rfq-search"
          searchLabel="Search requests for quotation"
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search RFQ ID, product or destination..."
          summary={`${visibleRfqs.length} of ${rfqs.length} requests`}
          tabs={
            <FilterTabs
              label="Filter RFQs by status"
              tabs={rfqStatusFilters}
              activeId={statusFilterId}
              onChange={setStatusFilterId}
            />
          }
        />

        <DataState
          loading={loading}
          error={error}
          onRetry={reload}
          isEmpty={visibleRfqs.length === 0}
          skeletonRows={5}
          empty={
            <EmptyState
              icon="rfq"
              title="No requests to show"
              description="Send a new RFQ to start collecting supplier quotes."
              action={
                <Button variant="accent" size="md" onClick={() => setFormOpen(true)}>
                  {actionLabels.newRfq}
                </Button>
              }
            />
          }
        >
          <RfqTable rfqs={visibleRfqs} currencyCode={currencyCode} />
        </DataState>
      </Panel>
    </>
  );
}
