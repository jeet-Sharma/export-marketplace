'use client';

import { useState } from 'react';
import DataState from '@/components/buyer/DataState';
import PageHeader from '@/components/buyer/PageHeader';
import { pageHeaders } from '@/data/seedData';
import api from '@/lib/api';
import useResource from '@/lib/useResource';
import AddressesTab from './AddressesTab';
import ComplianceTab from './ComplianceTab';
import HistoryTab from './HistoryTab';
import IdentityStrip from './IdentityStrip';
import PaymentMethodsTab from './PaymentMethodsTab';
import ProfileDetailsTab from './ProfileDetailsTab';
import ProfileTabs from './ProfileTabs';
import SuppliersTab from './SuppliersTab';

/**
 * Buyer company profile: identity strip and six tabbed sections.
 * @returns {import('react').ReactElement}
 */
export default function ProfileScreen() {
  const { data, loading, error, reload } = useResource(api.getProfile);
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <>
      <PageHeader title={pageHeaders.profile.title} breadcrumb={pageHeaders.profile.breadcrumb} />

      <DataState loading={loading} error={error} onRetry={reload} skeletonRows={6}>
        {data && (
          <>
            <IdentityStrip profile={data.profile} />
            <ProfileTabs activeId={activeTab} onChange={setActiveTab} />

            {activeTab === 'profile' && <ProfileDetailsTab profile={data.profile} />}
            {activeTab === 'addresses' && <AddressesTab />}
            {activeTab === 'payment-methods' && <PaymentMethodsTab />}
            {activeTab === 'compliance' && <ComplianceTab profile={data.profile} />}
            {activeTab === 'suppliers' && <SuppliersTab suppliers={data.suppliers} />}
            {activeTab === 'history' && <HistoryTab transactions={data.transactions} />}
          </>
        )}
      </DataState>
    </>
  );
}
