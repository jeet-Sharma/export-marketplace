// Dummy data for the ExportHub vendor dashboard.
// No data should be hardcoded in components — everything is pulled from here.
//
// Stat shape: `value` is raw (number), `format` says how StatCard renders it
// ("number" | "currency" | "percent"). `delta` is a raw signed number and is
// rendered with the same format unless `deltaFormat` overrides it; `trend`
// (up/down/neutral) is derived from delta's sign unless a row needs to
// override it (e.g. a note-only row with no meaningful sign). `note` is a
// plain-text annotation used instead of, or alongside, a numeric delta.
import type { StatCardData } from "@/types/stats";
import type { RecentOrder } from "@/types/order";
import type { PendingRfq } from "@/types/rfq";
import type { LowStockAlert } from "@/types/inventory";

export const dashboardStats: StatCardData[] = [
  {
    id: "orders",
    label: "Total Orders",
    value: 128,
    format: "number",
    delta: 12,
  },
  {
    id: "earnings",
    label: "Earnings",
    value: 24680,
    format: "currency",
    delta: 8,
  },
  {
    id: "products",
    label: "Products Listed",
    value: 17,
    format: "number",
    delta: null,
    trend: "neutral",
    note: "2 pending",
  },
  {
    id: "readiness",
    label: "Export Readiness",
    value: 75,
    format: "percent",
    delta: null,
    trend: "down",
    note: "3 docs missing",
  },
];

export const recentOrders: RecentOrder[] = [
  {
    id: "#101",
    product: "Turmeric Powder",
    buyer: "Global Foods LLC",
    country: "USA",
    status: "pending",
  },
  {
    id: "#102",
    product: "Cotton Bedsheet",
    buyer: "Al Noor Trading",
    country: "UAE",
    status: "shipped",
  },
  {
    id: "#100",
    product: "Wooden Handicraft",
    buyer: "Heritage Home Co.",
    country: "UK",
    status: "delivered",
  },
];

export const pendingRfqs: PendingRfq[] = [
  {
    id: "rfq-1",
    product: "Turmeric Powder",
    quantity: "2,000kg",
    target: "$8.20/kg",
    country: "USA",
    isNew: true,
  },
  {
    id: "rfq-2",
    product: "Cotton Bedsheet",
    quantity: "500 sets",
    target: "$7.50/set",
    country: "Germany",
    isNew: true,
  },
];

export const lowStockAlerts: LowStockAlert[] = [
  {
    id: "ls-1",
    product: "Wooden Handicraft",
    unitsLeft: 18,
    threshold: 20,
  },
];

export interface VendorProfile {
  name: string;
  verified: boolean;
}

export const vendorProfile: VendorProfile = {
  name: "Vendor Panel",
  verified: true,
};
