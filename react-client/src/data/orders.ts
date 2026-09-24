// Vendor order book seed data.
// `value` on each order row is raw cents-free USD (number), formatted at
// render time by OrderTable — not pre-formatted here.
import type { StatCardData } from "@/types/stats";
import type { Order } from "@/types/order";

export const orderStats: StatCardData[] = [
  { id: "open", label: "Open Orders", value: 24, format: "number", delta: 4 },
  {
    id: "transit",
    label: "In Transit",
    value: 9,
    format: "number",
    delta: 2,
  },
  {
    id: "value",
    label: "Order Value",
    value: 48220,
    format: "currency",
    delta: 11,
  },
  {
    id: "disputes",
    label: "Disputes",
    value: 1,
    format: "number",
    delta: null,
    trend: "down",
    note: "1 open",
  },
];

export const orderBook: Order[] = [
  {
    id: "#101",
    product: "Turmeric Powder",
    buyer: "Global Foods LLC",
    country: "USA",
    quantity: "2,000 kg",
    value: 16400,
    incoterm: "FOB",
    placed: "2026-09-14",
    status: "pending",
  },
  {
    id: "#102",
    product: "Cotton Bedsheet",
    buyer: "Al Noor Trading",
    country: "UAE",
    quantity: "500 sets",
    value: 3750,
    incoterm: "CIF",
    placed: "2026-09-11",
    status: "shipped",
  },
  {
    id: "#100",
    product: "Wooden Handicraft",
    buyer: "Heritage Home Co.",
    country: "UK",
    quantity: "800 pcs",
    value: 1200,
    incoterm: "FOB",
    placed: "2026-09-02",
    status: "delivered",
  },
  {
    id: "#099",
    product: "Red Chilli Powder",
    buyer: "Spice Route BV",
    country: "Netherlands",
    quantity: "1,200 kg",
    value: 7800,
    incoterm: "CIF",
    placed: "2026-08-28",
    status: "processing",
  },
  {
    id: "#098",
    product: "Turmeric Powder",
    buyer: "Andes Import SA",
    country: "Chile",
    quantity: "600 kg",
    value: 4920,
    incoterm: "FOB",
    placed: "2026-08-19",
    status: "cancelled",
  },
];

export interface OrdersMeta {
  panelTitle: string;
  searchPlaceholder: string;
}

export const ordersMeta: OrdersMeta = {
  panelTitle: "Order Book",
  searchPlaceholder: "Search orders...",
};
