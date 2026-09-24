// Incoming buyer requests for quotation.
import type { StatCardData } from "@/types/stats";
import type { RfqRequest } from "@/types/rfq";

export const rfqStats: StatCardData[] = [
  { id: "open", label: "Open RFQs", value: 6, format: "number", delta: 2 },
  {
    id: "quoted",
    label: "Quoted",
    value: 4,
    format: "number",
    delta: null,
    trend: "neutral",
    note: "awaiting buyer",
  },
  { id: "won", label: "Won", value: 3, format: "number", delta: 1 },
  {
    id: "winRate",
    label: "Win Rate",
    value: 42,
    format: "percent",
    delta: -3,
  },
];

export const rfqRequests: RfqRequest[] = [
  {
    id: "RFQ-2041",
    product: "Turmeric Powder",
    buyer: "Global Foods LLC",
    country: "USA",
    quantity: "2,000 kg",
    target: "$8.20/kg",
    incoterm: "FOB",
    dueDate: "2026-09-26",
    status: "open",
  },
  {
    id: "RFQ-2040",
    product: "Cotton Bedsheet",
    buyer: "Weber Handel GmbH",
    country: "Germany",
    quantity: "500 sets",
    target: "$7.50/set",
    incoterm: "CIF",
    dueDate: "2026-09-24",
    status: "open",
  },
  {
    id: "RFQ-2038",
    product: "Wooden Handicraft",
    buyer: "Heritage Home Co.",
    country: "UK",
    quantity: "1,500 pcs",
    target: "$1.40/pc",
    incoterm: "FOB",
    dueDate: "2026-09-20",
    status: "quoted",
  },
  {
    id: "RFQ-2033",
    product: "Red Chilli Powder",
    buyer: "Spice Route BV",
    country: "Netherlands",
    quantity: "900 kg",
    target: "$6.10/kg",
    incoterm: "CIF",
    dueDate: "2026-09-08",
    status: "expired",
  },
];

export interface RfqMeta {
  panelTitle: string;
  searchPlaceholder: string;
}

export const rfqMeta: RfqMeta = {
  panelTitle: "Incoming RFQs",
  searchPlaceholder: "Search RFQs...",
};
