// Buyer order history seed data — the buyer-side counterpart to
// data/orders.ts (vendor's order book). Same rules apply: `value` is raw
// USD (number), formatted at render time by BuyerOrderTable, not
// pre-formatted here.
import type { StatCardData } from "@/types/stats";
import type { BuyerOrder } from "@/types/order";

export const buyerOrderStats: StatCardData[] = [
  { id: "total", label: "Total Orders", value: 14, format: "number", delta: 3 },
  {
    id: "inTransit",
    label: "In Transit",
    value: 2,
    format: "number",
    delta: 1,
  },
  {
    id: "spend",
    label: "Total Spend",
    value: 18420,
    format: "currency",
    delta: 15,
  },
  {
    id: "disputes",
    label: "Disputes",
    value: 0,
    format: "number",
    delta: null,
    trend: "neutral",
    note: "None open",
  },
];

export const buyerOrderBook: BuyerOrder[] = [
  {
    id: "#B-501",
    product: "Turmeric Powder",
    supplier: "ABC Exports",
    country: "India",
    quantity: "500 kg",
    value: 4100,
    incoterm: "FOB",
    placed: "2026-09-16",
    status: "shipped",
  },
  {
    id: "#B-500",
    product: "Cotton Bedsheet",
    supplier: "XYZ Traders",
    country: "India",
    quantity: "200 sets",
    value: 1500,
    incoterm: "CIF",
    placed: "2026-09-10",
    status: "delivered",
  },
  {
    id: "#B-498",
    product: "Wooden Handicraft",
    supplier: "India Crafts",
    country: "India",
    quantity: "300 pcs",
    value: 450,
    incoterm: "FOB",
    placed: "2026-09-03",
    status: "pending",
  },
  {
    id: "#B-495",
    product: "Red Chilli Powder",
    supplier: "Spice Route Exports",
    country: "India",
    quantity: "400 kg",
    value: 2600,
    incoterm: "CIF",
    placed: "2026-08-27",
    status: "processing",
  },
  {
    id: "#B-490",
    product: "Turmeric Powder",
    supplier: "ABC Exports",
    country: "India",
    quantity: "250 kg",
    value: 2050,
    incoterm: "FOB",
    placed: "2026-08-15",
    status: "cancelled",
  },
];

export interface BuyerOrdersMeta {
  panelTitle: string;
  searchPlaceholder: string;
}

export const buyerOrdersMeta: BuyerOrdersMeta = {
  panelTitle: "My Orders",
  searchPlaceholder: "Search your orders...",
};
