import Button from '@/components/ui/Button';
import Panel from '@/components/ui/Panel';
import EmptyState from '@/components/buyer/EmptyState';
import { dashboardCopy, dashboardLimits } from '@/data/seedData';
import RfqSnapshotCard from './RfqSnapshotCard';

/**
 * Open RFQs, newest first, with a link through to the full list.
 *
 * @param {object} props
 * @param {import('@/lib/filterRfqs').RfqRecord[]} props.rfqs Already sorted.
 * @param {string} props.currencyCode
 * @returns {import('react').ReactElement}
 */
export default function RfqSnapshotPanel({ rfqs, currencyCode }) {
  const visibleRfqs = rfqs.slice(0, dashboardLimits.rfqSnapshot);

  return (
    <Panel
      title={dashboardCopy.rfqSnapshotTitle}
      footer={
        <Button href="/rfq" variant="ghost" size="md" fullWidth>
          {dashboardCopy.viewAllRfqsLabel}
        </Button>
      }
      bodyClassName={visibleRfqs.length ? 'space-y-2 p-3' : undefined}
      padded={false}
    >
      {visibleRfqs.length ? (
        visibleRfqs.map((rfq) => (
          <RfqSnapshotCard key={rfq.id} rfq={rfq} currencyCode={currencyCode} />
        ))
      ) : (
        <EmptyState
          icon="rfq"
          title="No open requests"
          description="Send an RFQ to start collecting supplier quotes."
        />
      )}
    </Panel>
  );
}
