// Vendor sidebar navigation config: brand, signed-in company footer, and
// the grouped nav itself. Kept separate from /data/seedData.js because this
// is app configuration (routes/labels/icons), not dashboard seed data.
import type { NavIconName } from "@/components/vendor/NavIcon";

export interface NavItem {
  id: string;
  label: string;
  icon: NavIconName;
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

// Signed-in buyer footer identity, shown in the buyer sidebar footer — the
// buyer-side counterpart to vendorCompany above. Mirrors its shape exactly
// (name/initials/status) so Sidebar.tsx's company footer renders either
// one unmodified via its `company` prop.
export const buyerCompany = {
  name: "Priya Sharma",
  initials: "PS",
  status: "Verified Buyer",
};

export const buyerBrand = {
  name: "ExportHub",
  panelLabel: "Buyer Panel",
};

// Buyer sidebar navigation, grouped exactly like sidebarNav above but
// pointed at /buyer/** routes and buyer-specific concepts (wishlist, cart,
// sent RFQs) instead of vendor's product/inventory management.
export const buyerNav: NavGroup[] = [
  {
    id: "shopping",
    heading: "Shopping",
    items: [
      { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/buyer/dashboard" },
      { id: "orders", label: "Orders", icon: "orders", href: "/buyer/orders" },
      { id: "wishlist", label: "Wishlist", icon: "wishlist", href: "/buyer/wishlist" },
      { id: "cart", label: "Cart", icon: "cart", href: "/buyer/cart" },
      { id: "rfq", label: "RFQs", icon: "rfq", href: "/buyer/rfqs" },
    ],
  },
  {
    id: "account",
    heading: "Account",
    items: [{ id: "profile", label: "Profile", icon: "profile", href: "/buyer/profile" }],
  },
];
