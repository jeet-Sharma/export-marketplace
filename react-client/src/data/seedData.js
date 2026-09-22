/**
 * Shell-level seed data: brand, sidebar navigation, page header copy and the
 * dashboard's non-derivable analytics figures.
 */

export const brand = {
  name: 'ExportHub',
  panelLabel: 'BUYER PANEL',
};

/**
 * @typedef {object} NavItem
 * @property {string} href
 * @property {string} label
 * @property {import('@/components/buyer/NavIcon').NavIconName} icon
 *
 * @typedef {object} NavSection
 * @property {string} id
 * @property {string} label
 * @property {NavItem[]} items
 */

/** @type {NavSection[]} */
export const navSections = [
  {
    id: 'sourcing',
    label: 'Sourcing',
    items: [
      { href: '/', label: 'Dashboard', icon: 'dashboard' },
      { href: '/products', label: 'Products', icon: 'products' },
      { href: '/wishlist', label: 'Wishlist', icon: 'wishlist' },
      { href: '/rfq', label: 'RFQ', icon: 'rfq' },
    ],
  },
  {
    id: 'orders',
    label: 'Orders',
    items: [
      { href: '/orders', label: 'Orders', icon: 'orders' },
      { href: '/cart', label: 'Cart', icon: 'cart' },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [{ href: '/profile', label: 'Profile', icon: 'profile' }],
  },
];

/** Title and breadcrumb copy per screen. */
export const pageHeaders = {
  dashboard: { title: 'Dashboard', breadcrumb: 'Buyer Panel / Dashboard' },
  products: { title: 'Products', breadcrumb: 'Buyer Panel / Browse Products' },
  wishlist: { title: 'Wishlist', breadcrumb: 'Buyer Panel / Wishlist' },
  orders: { title: 'Orders', breadcrumb: 'Buyer Panel / Order History' },
  orderDetail: { breadcrumb: 'Buyer Panel / Order History' },
  rfq: { title: 'RFQ', breadcrumb: 'Buyer Panel / Requests for Quotation' },
  rfqDetail: { breadcrumb: 'Buyer Panel / Requests for Quotation' },
  cart: { title: 'Cart', breadcrumb: 'Buyer Panel / Cart' },
  checkout: { title: 'Checkout', breadcrumb: 'Buyer Panel / Checkout' },
  profile: { title: 'Profile', breadcrumb: 'Buyer Panel / Company Profile' },
};

/** Shared action labels so both portals name the same action identically. */
export const actionLabels = {
  newRfq: '+ New RFQ',
  kycVerified: 'KYC Verified',
  payNow: 'Pay Now',
  track: 'Track',
  reorder: 'Reorder',
  invoice: 'Invoice',
  view: 'View',
  compare: 'Compare',
  addToCart: 'Add to Cart',
  addToWishlist: 'Add to Wishlist',
  moveToCart: 'Move to Cart',
  remove: 'Remove',
  contactSupplier: 'Contact Supplier',
  proceedToCheckout: 'Proceed to Checkout',
  placeOrder: 'Place Order',
};

/**
 * Figures the analytics endpoint supplies because they compare against periods
 * that are not present in the seeded collections.
 */
export const analyticsDeltas = {
  spendGrowthPct: 15,
};

/** How many rows each dashboard panel shows. */
export const dashboardLimits = {
  recentOrders: 5,
  rfqSnapshot: 3,
};

export const dashboardCopy = {
  recentOrdersTitle: 'Recent Orders',
  rfqSnapshotTitle: 'RFQ Snapshot',
  viewAllRfqsLabel: 'View all RFQs',
  newQuoteLabel: 'New Quote',
  paymentAlertTitle: 'Payment failed',
  paymentAlertDescription:
    'The card payment for this order was declined. Settle it to release the shipment for production.',
};

export const statLabels = {
  totalOrders: 'Total Orders',
  totalSpend: 'Total Spend',
  openRfqs: 'Open RFQs',
  savedSuppliers: 'Saved Suppliers',
  activeOrders: 'Active Orders',
  delivered: 'Delivered',
  paymentIssues: 'Payment Issues',
  quoted: 'Quoted',
  closed: 'Closed',
  avgResponseTime: 'Avg. Response Time',
};

export default navSections;
