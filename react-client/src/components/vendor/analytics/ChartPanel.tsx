import Panel from "@/components/ui/Panel";
import { formatStatValue } from "@/lib/formatters";
import type { StatFormat } from "@/types/stats";
import type { RevenueByMonth, TopMarket } from "@/types/analytics";

export interface BarChartProps {
  title: string;
  data?: RevenueByMonth[];
  valueFormat?: StatFormat;
}

// Vertical bar chart drawn as plain SVG so the project takes on no chart
// dependency. Scale is derived from the data, so seed values can change
// freely without touching this component. A visually-hidden data table is
// rendered alongside the chart so screen reader users get the real values
// as a table rather than one long aria-label sentence.
export function BarChart({ title, data = [], valueFormat = "currency" }: BarChartProps) {
  const max = data.reduce((peak, point) => Math.max(peak, point.value), 0) || 1;

  return (
    <Panel title={title} bodyClassName="p-4">
      <div className="flex items-end gap-2 h-[180px]" aria-hidden="true">
        {data.map((point) => {
          const heightPct = (point.value / max) * 100;
          return (
            <div
              key={point.label}
              className="flex flex-1 flex-col items-center justify-end gap-2 h-full"
            >
              <span className="font-heading font-medium text-text-dim text-[10px]">
                {Math.round(point.value / 1000)}k
              </span>
              <div
                className="w-full bg-saffron rounded-t"
                style={{ height: `${heightPct}%`, minHeight: "2px" }}
              />
              <span className="font-body text-text-dim text-[11px]">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.label}>
              <td>{point.label}</td>
              <td>{formatStatValue(point.value, valueFormat)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export interface RankedBarsProps {
  title: string;
  data?: TopMarket[];
  suffix?: string;
}

// Horizontal ranked bars, used for share-of-revenue style breakdowns.
export function RankedBars({ title, data = [], suffix = "%" }: RankedBarsProps) {
  const max = data.reduce((peak, point) => Math.max(peak, point.value), 0) || 1;

  return (
    <Panel title={title} bodyClassName="p-4">
      <ul className="flex flex-col gap-3">
        {data.map((point) => (
          <li key={point.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-body text-text text-[13px]">
                {point.label}
              </span>
              <span className="font-heading font-semibold text-ink text-[13px]">
                {point.value}
                {suffix}
              </span>
            </div>
            <div className="bg-paper border border-line rounded h-2 w-full">
              <div
                className="bg-teal h-full rounded"
                style={{ width: `${(point.value / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
