// Incoming buyer requests for quotation.

export const rfqStats = [
  { id: "open", label: "Open RFQs", value: "6", delta: "+2", trend: "up" },
  { id: "quoted", label: "Quoted", value: "4", delta: "awaiting buyer", trend: "neutral" },
  { id: "won", label: "Won", value: "3", delta: "+1", trend: "up" },
  {
    id: "winRate",
    label: "Win Rate",
    value: "42%",
    delta: "-3%",
    trend: "down",
  },
];

export const rfqRequests = [
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

export const rfqMeta = {
  panelTitle: "Incoming RFQs",
  searchPlaceholder: "Search RFQs...",
};
