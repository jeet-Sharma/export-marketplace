"use client";

import { useRouter } from "next/navigation";
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
import { routes } from "@/config/routes";

// Buyer dashboard — mirrors vendor/dashboard/DashboardPage.tsx section for
// section (stat row, orders + RFQ two-column layout), swapping vendor
// concepts (recent incoming orders, pending RFQs to quote) for their buyer
// equivalents (recent own orders, RFQs sent awaiting quotes).
//
// Unlike the vendor dashboard (whose row/view-all actions stay
// unwired since there's no vendor order-detail page yet), these buttons
// are wired to real destinations: /buyer/orders and /buyer/rfqs both
// exist, so "Track"/"Invoice"/"Reorder"/"View Quotes"/"View all" have
// somewhere real to send the buyer — the full order/RFQ list, since
// there's no per-order or per-RFQ detail page yet to deep-link into.
export default function DashboardPage() {
  const router = useRouter();

  return (
    <>
      <PageHeader
        title="Dashboard"
        breadcrumb="Buyer Panel / Dashboard"
        actionLabel="+ Browse Products"
        onAction={() => router.push(routes.home)}
        verified={buyerProfileSummary.verified}
        verifiedLabel="Verified Buyer"
      />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          <StatRow stats={buyerDashboardStats} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecentBuyerOrdersTable
                orders={recentBuyerOrders}
                onViewAll={() => router.push(routes.buyerOrders)}
                onTrack={() => router.push(routes.buyerOrders)}
                onInvoice={() => router.push(routes.buyerOrders)}
                onReorder={() => router.push(routes.buyerOrders)}
              />
            </div>
            <div className="lg:col-span-1">
              <BuyerRfqPreviewList
                rfqs={buyerPendingRfqs}
                onViewAll={() => router.push(routes.buyerRfqs)}
                onViewQuotes={() => router.push(routes.buyerRfqs)}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
