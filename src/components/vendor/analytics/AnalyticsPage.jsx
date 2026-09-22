import Panel from "@/components/ui/Panel";
import Table, { cellClassName } from "@/components/ui/Table";
import PageHeader from "@/components/vendor/PageHeader";
import StatRow from "@/components/vendor/dashboard/StatRow";
import { BarChart, RankedBars } from "@/components/vendor/analytics/ChartPanel";
import {
  analyticsStats,
  revenueByMonth,
  topMarkets,
  topProducts,
  analyticsMeta,
} from "@/data/analytics";
import { formatStatValue } from "@/lib/formatters";

const PRODUCT_COLUMNS = ["Product", "Orders", "Revenue"];

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics"
        breadcrumb="Vendor Panel / Analytics"
        actionLabel="Export Report"
      />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          <StatRow stats={analyticsStats} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <BarChart
                title={analyticsMeta.revenuePanelTitle}
                data={revenueByMonth}
                valueFormat="currency"
              />
            </div>
            <div className="lg:col-span-1">
              <RankedBars
                title={analyticsMeta.marketsPanelTitle}
                data={topMarkets}
              />
            </div>
          </div>

          <Panel title={analyticsMeta.productsPanelTitle}>
            <Table
              columns={PRODUCT_COLUMNS}
              caption={analyticsMeta.productsPanelTitle}
            >
              {topProducts.map((row) => (
                <tr key={row.id}>
                  <td
                    className={`px-4 py-3 font-heading font-semibold ${cellClassName({ emphasis: true })}`}
                  >
                    {row.product}
                  </td>
                  <td className={`px-4 py-3 ${cellClassName()}`}>
                    {row.orders}
                  </td>
                  <td
                    className={`px-4 py-3 font-heading font-medium ${cellClassName({ extra: "text-teal" })}`}
                  >
                    {formatStatValue(row.revenue, "currency")}
                  </td>
                </tr>
              ))}
            </Table>
          </Panel>
        </div>
      </main>
    </>
  );
}
