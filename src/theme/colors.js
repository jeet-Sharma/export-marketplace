// Central color tokens for the ExportHub vendor dashboard.
//
// These hex values are registered once in src/app/globals.css under @theme
// and consumed everywhere as Tailwind utility classes (bg-ink, text-saffron,
// border-line, etc) — components should not import this file to build
// inline styles. This module exists so non-component code (chart math,
// docs, tests) has a single source of truth for the same values, and so
// statusTokens below can map status keys to Tailwind class names.

const colors = {
  ink: "#10213A",
  paper: "#F6F4EE",
  panel: "#FFFFFF",
  line: "#E4DFD2",

  saffron: "#C97A1A",
  saffronSoft: "#F3E3C8",

  teal: "#2F7D6E",
  tealSoft: "#DCEDE8",

  coral: "#B84A3B",
  coralSoft: "#F5DFDA",

  blueGrey: "#3A4E7A",
  blueGreySoft: "#E4E9F5",

  text: "#1B2333",
  textDim: "#66707F",
};

export default colors;

// Sidebar surface tokens, expressed as Tailwind class names. These alias
// the shared palette so the sidebar reads as the same surface as the
// dashboard — no separate ramp.
export const sidebarClasses = {
  bg: "bg-panel",
  bgActive: "bg-saffron-soft",
  bgHover: "bg-paper",
  border: "border-line",
  heading: "text-text-dim",
  item: "text-text",
  itemActive: "text-ink",
  brand: "text-ink",
  panelLabel: "text-saffron",
  accentBorder: "border-saffron",
  footerBg: "bg-paper",
};

// Status pill token mapping, shared by every vendor screen, expressed as a
// Tailwind tone name that Badge.jsx already knows how to render, plus the
// display label.
// Base rule: pending=saffron, approved/delivered=teal, shipped=blueGrey,
// rejected/low=coral. Everything below follows the same semantics:
// saffron = needs attention, teal = good, blueGrey = in flight, coral = problem.
export const statusTokens = {
  // Orders
  pending: { tone: "saffron", label: "Pending" },
  approved: { tone: "teal", label: "Approved" },
  delivered: { tone: "teal", label: "Delivered" },
  shipped: { tone: "blueGrey", label: "Shipped" },
  rejected: { tone: "coral", label: "Rejected" },
  processing: { tone: "blueGrey", label: "Processing" },
  cancelled: { tone: "coral", label: "Cancelled" },

  // Products
  live: { tone: "teal", label: "Live" },
  draft: { tone: "neutral", label: "Draft" },
  review: { tone: "saffron", label: "In Review" },

  // Inventory
  low: { tone: "coral", label: "Low Stock" },
  inStock: { tone: "teal", label: "In Stock" },
  outOfStock: { tone: "coral", label: "Out of Stock" },

  // RFQ
  open: { tone: "saffron", label: "Open" },
  quoted: { tone: "blueGrey", label: "Quoted" },
  won: { tone: "teal", label: "Won" },
  expired: { tone: "coral", label: "Expired" },

  // Documents / compliance
  verified: { tone: "teal", label: "Verified" },
  uploaded: { tone: "blueGrey", label: "Uploaded" },
  missing: { tone: "coral", label: "Missing" },
};
