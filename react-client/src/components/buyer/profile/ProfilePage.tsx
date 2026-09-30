"use client";

import PageHeader from "@/components/vendor/PageHeader";
import StatusPill from "@/components/vendor/StatusPill";
import AddressForm from "@/components/buyer/profile/AddressForm";
import PaymentMethodsPanel from "@/components/buyer/profile/PaymentMethodsPanel";
import { buyerProfile, buyerProfileMeta } from "@/data/buyerProfile";

// Buyer profile — mirrors vendor/profile/ProfilePage.tsx's structure
// exactly: identity strip with a StatusPill, then a two-column grid of a
// details form and a side panel (payment methods here, verification
// checklist there).
export default function ProfilePage() {
  return (
    <>
      <PageHeader
        title="Profile"
        breadcrumb="Buyer Panel / Account Profile"
        verified={buyerProfile.panelStatus === "verified"}
        verifiedLabel="Verified Buyer"
      />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* Identity strip */}
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between bg-panel border border-line rounded">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center font-heading font-bold bg-blue-grey text-panel w-10 h-10 rounded text-[14px]">
                {buyerProfile.initials}
              </span>
              <span className="flex flex-col">
                <span className="font-heading font-bold text-ink text-[16px]">
                  {buyerProfile.fullName}
                </span>
                <span className="font-body text-text-dim text-[12px]">
                  {buyerProfile.companyName}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-body text-text-dim text-[12px]">
                {buyerProfileMeta.complianceTitle}:
              </span>
              <StatusPill status={buyerProfile.panelStatus} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <AddressForm />
            </div>
            <div className="lg:col-span-1">
              <PaymentMethodsPanel />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
