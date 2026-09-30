"use client";

import PageHeader from "@/components/vendor/PageHeader";
import StatRow from "@/components/vendor/dashboard/StatRow";
import RecentBuyerOrdersTable from "@/components/buyer/dashboard/RecentBuyerOrdersTable";
import BuyerRfqPreviewList from "@/components/buyer/dashboard/BuyerRfqPreviewList";
import {
  buyerDashboardStats,
  recentBuyerOrders,
  buyerPendingRfqs,
  buyerProfileSummary,
} from "@/data/buyerSeedData";

// Buyer dashboard — mirrors vendor/dashboard/DashboardPage.tsx section for
// section (stat row, orders + RFQ two-column layout), swapping vendor
// concepts (recent incoming orders, pending RFQs to quote) for their buyer
// equivalents (recent own orders, RFQs sent awaiting quotes).
export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        breadcrumb="Buyer Panel / Dashboard"
        actionLabel="+ Browse Products"
        verified={buyerProfileSummary.verified}
        verifiedLabel="Verified Buyer"
      />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          <StatRow stats={buyerDashboardStats} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecentBuyerOrdersTable orders={recentBuyerOrders} />
            </div>
            <div className="lg:col-span-1">
              <BuyerRfqPreviewList rfqs={buyerPendingRfqs} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
