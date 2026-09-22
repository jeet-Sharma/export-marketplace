// Central color tokens for the ExportHub vendor dashboard.
// Components must import from here — no hardcoded hex values in components.

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

// Sidebar surface tokens. These are aliases over the shared palette so the
// sidebar reads as the same surface as the dashboard — no separate ramp.
export const sidebarColors = {
  bg: colors.panel,
  bgActive: colors.saffronSoft,
  bgHover: colors.paper,
  line: colors.line,
  heading: colors.textDim,
  item: colors.text,
  itemActive: colors.ink,
  brand: colors.ink,
  panelLabel: colors.saffron,
  accent: colors.saffron,
  footerBg: colors.paper,
};

// Status pill token mapping, shared by every vendor screen.
// Base rule: pending=saffron, approved/delivered=teal, shipped=blueGrey,
// rejected/low=coral. Everything below follows the same semantics:
// saffron = needs attention, teal = good, blueGrey = in flight, coral = problem.
export const statusTokens = {
  // Orders
  pending: { fg: colors.saffron, bg: colors.saffronSoft, label: "Pending" },
  approved: { fg: colors.teal, bg: colors.tealSoft, label: "Approved" },
  delivered: { fg: colors.teal, bg: colors.tealSoft, label: "Delivered" },
  shipped: { fg: colors.blueGrey, bg: colors.blueGreySoft, label: "Shipped" },
  rejected: { fg: colors.coral, bg: colors.coralSoft, label: "Rejected" },
  processing: {
    fg: colors.blueGrey,
    bg: colors.blueGreySoft,
    label: "Processing",
  },
  cancelled: { fg: colors.coral, bg: colors.coralSoft, label: "Cancelled" },

  // Products
  live: { fg: colors.teal, bg: colors.tealSoft, label: "Live" },
  draft: { fg: colors.textDim, bg: colors.paper, label: "Draft" },
  review: { fg: colors.saffron, bg: colors.saffronSoft, label: "In Review" },

  // Inventory
  low: { fg: colors.coral, bg: colors.coralSoft, label: "Low Stock" },
  inStock: { fg: colors.teal, bg: colors.tealSoft, label: "In Stock" },
  outOfStock: { fg: colors.coral, bg: colors.coralSoft, label: "Out of Stock" },

  // RFQ
  open: { fg: colors.saffron, bg: colors.saffronSoft, label: "Open" },
  quoted: { fg: colors.blueGrey, bg: colors.blueGreySoft, label: "Quoted" },
  won: { fg: colors.teal, bg: colors.tealSoft, label: "Won" },
  expired: { fg: colors.coral, bg: colors.coralSoft, label: "Expired" },

  // Documents / compliance
  verified: { fg: colors.teal, bg: colors.tealSoft, label: "Verified" },
  uploaded: { fg: colors.blueGrey, bg: colors.blueGreySoft, label: "Uploaded" },
  missing: { fg: colors.coral, bg: colors.coralSoft, label: "Missing" },
};
