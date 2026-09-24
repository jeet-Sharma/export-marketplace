// Analytics seed data. These are raw numbers throughout — the charts and
// stat cards compute scale and formatting from them at render time.
import type { StatCardData } from "@/types/stats";
import type { RevenueByMonth, TopMarket, TopProduct } from "@/types/analytics";

export const analyticsStats: StatCardData[] = [
  {
    id: "revenue",
    label: "Revenue (YTD)",
    value: 212400,
    format: "currency",
    delta: 14,
  },
  {
    id: "aov",
    label: "Avg Order Value",
    value: 1930,
    format: "currency",
    delta: 5,
  },
  {
    id: "quoteRate",
    label: "Quote Conversion",
    value: 42,
    format: "percent",
    delta: -3,
  },
  {
    id: "repeat",
    label: "Repeat Buyers",
    value: 31,
    format: "percent",
    delta: 7,
  },
];

// Monthly revenue in USD, used for the bar chart.
export const revenueByMonth: RevenueByMonth[] = [
  { label: "Jan", value: 12400 },
  { label: "Feb", value: 15200 },
  { label: "Mar", value: 14100 },
  { label: "Apr", value: 18600 },
  { label: "May", value: 17300 },
  { label: "Jun", value: 21500 },
  { label: "Jul", value: 19800 },
  { label: "Aug", value: 24600 },
  { label: "Sep", value: 26900 },
];

// Share of revenue by destination market, used for the ranked bars.
export const topMarkets: TopMarket[] = [
  { id: "usa", label: "United States", value: 34 },
  { id: "uae", label: "United Arab Emirates", value: 22 },
  { id: "deu", label: "Germany", value: 18 },
  { id: "gbr", label: "United Kingdom", value: 14 },
  { id: "nld", label: "Netherlands", value: 12 },
];

export const topProducts: TopProduct[] = [
  { id: "tp-1", product: "Turmeric Powder", orders: 52, revenue: 86300 },
  { id: "tp-2", product: "Cotton Bedsheet", orders: 38, revenue: 54900 },
  { id: "tp-3", product: "Wooden Handicraft", orders: 24, revenue: 41200 },
  { id: "tp-4", product: "Red Chilli Powder", orders: 14, revenue: 30000 },
];

export interface AnalyticsMeta {
  revenuePanelTitle: string;
  marketsPanelTitle: string;
  productsPanelTitle: string;
  currencyPrefix: string;
}

export const analyticsMeta: AnalyticsMeta = {
  revenuePanelTitle: "Revenue by Month",
  marketsPanelTitle: "Top Markets",
  productsPanelTitle: "Top Products",
  currencyPrefix: "$",
};
