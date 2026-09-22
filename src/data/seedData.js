// Dummy data for the ExportHub vendor dashboard.
// No data should be hardcoded in components — everything is pulled from here.
//
// Stat shape: `value` is raw (number), `format` says how StatCard renders it
// ("number" | "currency" | "percent"). `delta` is a raw signed number and is
// rendered with the same format unless `deltaFormat` overrides it; `trend`
// (up/down/neutral) is derived from delta's sign unless a row needs to
// override it (e.g. a note-only row with no meaningful sign). `note` is a
// plain-text annotation used instead of, or alongside, a numeric delta.

export const dashboardStats = [
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

export const recentOrders = [
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

export const pendingRfqs = [
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

export const lowStockAlerts = [
  {
    id: "ls-1",
    product: "Wooden Handicraft",
    unitsLeft: 18,
    threshold: 20,
  },
];

export const vendorProfile = {
  name: "Vendor Panel",
  verified: true,
};

// Sidebar branding + the signed-in company shown in the sidebar footer.
export const vendorCompany = {
  name: "ABC Exports",
  initials: "AE",
  status: "Verified Supplier",
};

export const appBrand = {
  name: "ExportHub",
  panelLabel: "Vendor Panel",
};

// Sidebar navigation, grouped exactly as rendered.
// `icon` keys map to the glyph set in components/vendor/NavIcon.jsx.
export const sidebarNav = [
  {
    id: "workspace",
    heading: "Workspace",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/" },
      { id: "products", label: "Products", icon: "products", href: "/products" },
      { id: "orders", label: "Orders", icon: "orders", href: "/orders" },
      {
        id: "inventory",
        label: "Inventory",
        icon: "inventory",
        href: "/inventory",
      },
      { id: "rfq", label: "RFQ", icon: "rfq", href: "/rfq" },
    ],
  },
  {
    id: "insights",
    heading: "Insights",
    items: [
      {
        id: "analytics",
        label: "Analytics",
        icon: "analytics",
        href: "/analytics",
      },
      {
        id: "documents",
        label: "Documents",
        icon: "documents",
        href: "/documents",
      },
    ],
  },
  {
    id: "account",
    heading: "Account",
    items: [{ id: "profile", label: "Profile", icon: "profile", href: "/profile" }],
  },
];
