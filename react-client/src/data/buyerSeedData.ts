// Dummy data for the ExportHub buyer dashboard — the buyer-side
// counterpart to data/seedData.ts. Same shape/rules apply: no data should
// be hardcoded in components, everything is pulled from here; stat
// `value` is raw (number), `format` says how StatCard renders it.
import type { StatCardData } from "@/types/stats";
import type { RecentBuyerOrder } from "@/types/order";
import type { BuyerRfqRequest } from "@/types/rfq";

export const buyerDashboardStats: StatCardData[] = [
  {
    id: "orders",
    label: "Total Orders",
    value: 14,
    format: "number",
    delta: 3,
  },
  {
    id: "spend",
    label: "Total Spend",
    value: 18420,
    format: "currency",
    delta: 15,
  },
  {
    id: "wishlist",
    label: "Wishlist Items",
    value: 6,
    format: "number",
    delta: null,
    trend: "neutral",
    note: "2 back in stock",
  },
  {
    id: "rfqs",
    label: "Open RFQs",
    value: 3,
    format: "number",
    delta: null,
    trend: "up",
    note: "1 new quote",
  },
];

export const recentBuyerOrders: RecentBuyerOrder[] = [
  {
    id: "#B-501",
    product: "Turmeric Powder",
    supplier: "ABC Exports",
    country: "India",
    status: "shipped",
  },
  {
    id: "#B-500",
    product: "Cotton Bedsheet",
    supplier: "XYZ Traders",
    country: "India",
    status: "delivered",
  },
  {
    id: "#B-498",
    product: "Wooden Handicraft",
    supplier: "India Crafts",
    country: "India",
    status: "pending",
  },
];

export const buyerPendingRfqs: BuyerRfqRequest[] = [
  {
    id: "RFQ-B-12",
    product: "Turmeric Powder",
    quantity: "500 kg",
    target: "$8.00/kg",
    country: "USA",
    submitted: "2026-09-20",
    quotesReceived: 2,
    status: "quoted",
  },
  {
    id: "RFQ-B-11",
    product: "Cotton Bedsheet",
    quantity: "200 sets",
    target: "$7.20/set",
    country: "USA",
    submitted: "2026-09-18",
    quotesReceived: 0,
    status: "open",
  },
];

export interface BuyerProfileSummary {
  name: string;
  verified: boolean;
}

export const buyerProfileSummary: BuyerProfileSummary = {
  name: "Buyer Panel",
  verified: true,
};
