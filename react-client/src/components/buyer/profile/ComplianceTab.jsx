import Panel from '@/components/ui/Panel';
import DetailList from '@/components/buyer/DetailList';
import StatusPill from '@/components/buyer/StatusPill';
import { complianceItems } from '@/data/profile';
import formatDate from '@/lib/formatDate';

/**
 * KYC status, rating and membership details.
 * @param {object} props
 * @param {import('@/data/profile').buyerProfile} props.profile
 * @returns {import('react').ReactElement}
 */
export default function ComplianceTab({ profile }) {
  return (
    <>
      <Panel title="Account Standing">
        <DetailList
          variant="grid"
          items={[
            { label: 'Buyer Rating', value: `${profile.rating.toFixed(1)} (${profile.reviewCount} reviews)`, numeric: true },
            { label: 'Member Since', value: formatDate(profile.memberSince), numeric: true },
            { label: 'Importer Code', value: profile.importerCode, numeric: true },
          ]}
        />
      </Panel>

      <Panel title="Compliance Checks" padded={false}>
        <ul className="divide-y divide-line">
          {complianceItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-text">{item.label}</p>
                <p className="mt-0.5 text-xs text-textdim">{item.detail}</p>
              </div>
              <StatusPill status={item.status} />
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
