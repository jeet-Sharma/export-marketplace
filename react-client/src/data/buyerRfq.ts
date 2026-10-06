// RFQs the buyer has sent, plus the supplier quotes received against
// them — the buyer-side counterpart to data/rfq.ts (vendor's incoming
// RFQ inbox).
import type { StatCardData } from "@/types/stats";
import type { BuyerRfqRequest, SupplierQuote } from "@/types/rfq";

export const buyerRfqStats: StatCardData[] = [
  { id: "open", label: "Open RFQs", value: 3, format: "number", delta: 1 },
  {
    id: "quoted",
    label: "Quotes Received",
    value: 5,
    format: "number",
    delta: 2,
  },
  { id: "won", label: "Orders Placed", value: 2, format: "number", delta: 1 },
  {
    id: "avgResponse",
    label: "Avg. Response",
    value: 2,
    format: "number",
    delta: null,
    trend: "neutral",
    note: "days",
  },
];

export const buyerRfqRequests: BuyerRfqRequest[] = [
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
  {
    id: "RFQ-B-09",
    product: "Wooden Handicraft",
    quantity: "1,000 pcs",
    target: "$1.30/pc",
    country: "USA",
    submitted: "2026-09-10",
    quotesReceived: 3,
    status: "won",
  },
  {
    id: "RFQ-B-05",
    product: "Red Chilli Powder",
    quantity: "300 kg",
    target: "$6.00/kg",
    country: "USA",
    submitted: "2026-08-25",
    quotesReceived: 0,
    status: "expired",
  },
];

export const supplierQuotes: SupplierQuote[] = [
  {
    id: "q-1",
    rfqId: "RFQ-B-12",
    supplierName: "ABC Exports",
    supplierVerified: true,
    price: "$7.90/kg",
    delivery: "7 days",
  },
  {
    id: "q-2",
    rfqId: "RFQ-B-12",
    supplierName: "Golden Spice Co.",
    supplierVerified: false,
    price: "$8.10/kg",
    delivery: "10 days",
  },
  {
    id: "q-3",
    rfqId: "RFQ-B-09",
    supplierName: "India Crafts",
    supplierVerified: true,
    price: "$1.28/pc",
    delivery: "14 days",
  },
];

export interface BuyerRfqMeta {
  panelTitle: string;
  searchPlaceholder: string;
  compareTitle: string;
}

export const buyerRfqMeta: BuyerRfqMeta = {
  panelTitle: "My RFQs",
  searchPlaceholder: "Search your RFQs...",
  compareTitle: "Compare Quotes",
};
