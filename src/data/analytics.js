// Analytics seed data. Unlike the other screens these are raw numbers,
// because the charts need to compute scale from them.

export const analyticsStats = [
  {
    id: "revenue",
    label: "Revenue (YTD)",
    value: "$212,400",
    delta: "+14%",
    trend: "up",
  },
  {
    id: "aov",
    label: "Avg Order Value",
    value: "$1,930",
    delta: "+5%",
    trend: "up",
  },
  {
    id: "quoteRate",
    label: "Quote Conversion",
    value: "42%",
    delta: "-3%",
    trend: "down",
  },
  {
    id: "repeat",
    label: "Repeat Buyers",
    value: "31%",
    delta: "+7%",
    trend: "up",
  },
];

// Monthly revenue in USD, used for the bar chart.
export const revenueByMonth = [
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
export const topMarkets = [
  { id: "usa", label: "United States", value: 34 },
  { id: "uae", label: "United Arab Emirates", value: 22 },
  { id: "deu", label: "Germany", value: 18 },
  { id: "gbr", label: "United Kingdom", value: 14 },
  { id: "nld", label: "Netherlands", value: 12 },
];

export const topProducts = [
  { id: "tp-1", product: "Turmeric Powder", orders: 52, revenue: "$86,300" },
  { id: "tp-2", product: "Cotton Bedsheet", orders: 38, revenue: "$54,900" },
  { id: "tp-3", product: "Wooden Handicraft", orders: 24, revenue: "$41,200" },
  { id: "tp-4", product: "Red Chilli Powder", orders: 14, revenue: "$30,000" },
];

export const analyticsMeta = {
  revenuePanelTitle: "Revenue by Month",
  marketsPanelTitle: "Top Markets",
  productsPanelTitle: "Top Products",
  currencyPrefix: "$",
};
