// Vendor order book seed data.

export const orderStats = [
  { id: "open", label: "Open Orders", value: "24", delta: "+4", trend: "up" },
  {
    id: "transit",
    label: "In Transit",
    value: "9",
    delta: "+2",
    trend: "up",
  },
  {
    id: "value",
    label: "Order Value",
    value: "$48,220",
    delta: "+11%",
    trend: "up",
  },
  {
    id: "disputes",
    label: "Disputes",
    value: "1",
    delta: "1 open",
    trend: "down",
  },
];

export const orderBook = [
  {
    id: "#101",
    product: "Turmeric Powder",
    buyer: "Global Foods LLC",
    country: "USA",
    quantity: "2,000 kg",
    value: "$16,400",
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
    value: "$3,750",
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
    value: "$1,200",
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
    value: "$7,800",
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
    value: "$4,920",
    incoterm: "FOB",
    placed: "2026-08-19",
    status: "cancelled",
  },
];

export const ordersMeta = {
  panelTitle: "Order Book",
  searchPlaceholder: "Search orders...",
};
