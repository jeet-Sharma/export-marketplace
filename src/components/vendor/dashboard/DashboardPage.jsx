import PageHeader from "@/components/vendor/PageHeader";
import StatRow from "@/components/vendor/dashboard/StatRow";
import OrdersTable from "@/components/vendor/dashboard/OrdersTable";
import RfqList from "@/components/vendor/dashboard/RfqList";
import LowStockAlert from "@/components/vendor/dashboard/LowStockAlert";
import {
  dashboardStats,
  recentOrders,
  pendingRfqs,
  lowStockAlerts,
} from "@/data/seedData";

export default function DashboardPage() {
  return (
    <>
      {/* 1. Top bar */}
      <PageHeader
        title="Dashboard"
        breadcrumb="Vendor Panel / Dashboard"
        actionLabel="+ New Product"
      />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* 2. Stat row */}
          <StatRow stats={dashboardStats} />

          {/* 3. Two-column section, stacks to 1 col on mobile */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <OrdersTable orders={recentOrders} />
            </div>
            <div className="lg:col-span-1">
              <RfqList rfqs={pendingRfqs} />
            </div>
          </div>

          {/* 4. Low stock banner */}
          <LowStockAlert alerts={lowStockAlerts} />
        </div>
      </main>
    </>
  );
}
