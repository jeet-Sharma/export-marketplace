// Dummy data for the ExportHub vendor dashboard.
// No data should be hardcoded in components — everything is pulled from here.

export const dashboardStats = [
  {
    id: "orders",
    label: "Total Orders",
    value: "128",
    delta: "+12%",
    trend: "up",
  },
  {
    id: "earnings",
    label: "Earnings",
    value: "$24,680",
    delta: "+8%",
    trend: "up",
  },
  {
    id: "products",
    label: "Products Listed",
    value: "17",
    delta: "2 pending",
    trend: "neutral",
  },
  {
    id: "readiness",
    label: "Export Readiness",
    value: "75%",
    delta: "3 docs missing",
    trend: "down",
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
