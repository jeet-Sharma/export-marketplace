// Vendor sidebar navigation config: brand, signed-in company footer, and
// the grouped nav itself. Kept separate from /data/seedData.js because this
// is app configuration (routes/labels/icons), not dashboard seed data.

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

export interface NavGroup {
  id: string;
  heading: string;
  items: NavItem[];
}

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
export const sidebarNav: NavGroup[] = [
  {
    id: "workspace",
    heading: "Workspace",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/vendor/dashboard" },
      { id: "products", label: "Products", icon: "products", href: "/vendor/products" },
      { id: "orders", label: "Orders", icon: "orders", href: "/vendor/orders" },
      {
        id: "inventory",
        label: "Inventory",
        icon: "inventory",
        href: "/vendor/inventory",
      },
      { id: "rfq", label: "RFQ", icon: "rfq", href: "/vendor/rfqs" },
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
        href: "/vendor/analytics",
      },
      {
        id: "documents",
        label: "Documents",
        icon: "documents",
        href: "/vendor/documents",
      },
    ],
  },
  {
    id: "account",
    heading: "Account",
    items: [{ id: "profile", label: "Profile", icon: "profile", href: "/vendor/profile" }],
  },
];
