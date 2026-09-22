/**
 * Order history.
 *
 * Money is stored as the agreed line figures only (quantity, the unit price
 * locked at order time, freight and assessed duties). Subtotals, order totals
 * and lifetime spend are derived in `lib/orderTotals.js` — never stored here.
 *
 * @typedef {object} OrderMilestones
 * @property {string} placedOn
 * @property {string | null} paidOn
 * @property {string | null} productionOn
 * @property {string | null} shippedOn
 * @property {string | null} customsOn
 * @property {string | null} deliveredOn
 *
 * @typedef {object} Order
 * @property {string} id
 * @property {string} productId
 * @property {string} supplierId
 * @property {number} quantity
 * @property {number} unitPriceUsd Price agreed when the order was placed.
 * @property {number} freightUsd
 * @property {number} dutiesUsd
 * @property {'processing' | 'in-transit' | 'delivered' | 'payment-failed'} status
 * @property {'paid' | 'payment-failed'} paymentStatus
 * @property {string} incoterm
 * @property {string | null} trackingNumber
 * @property {string | null} carrier
 * @property {string} expectedOn
 * @property {{ city: string, country: string }} destination
 * @property {OrderMilestones} milestones
 */

/** @type {Order[]} */
export const orders = [
  {
    id: 'ORD-2031',
    productId: 'prd-1001',
    supplierId: 'sup-abc',
    quantity: 300,
    unitPriceUsd: 4.0,
    freightUsd: 190,
    dutiesUsd: 60,
    status: 'delivered',
    paymentStatus: 'paid',
    incoterm: 'CIF',
    trackingNumber: 'MAEU-4417823',
    carrier: 'Maersk',
    expectedOn: '2026-04-10',
    destination: { city: 'Hamburg', country: 'Germany' },
    milestones: {
      placedOn: '2026-03-04',
      paidOn: '2026-03-05',
      productionOn: '2026-03-08',
      shippedOn: '2026-03-16',
      customsOn: '2026-04-02',
      deliveredOn: '2026-04-08',
    },
  },
  {
    id: 'ORD-2032',
    productId: 'prd-1002',
    supplierId: 'sup-himalayan',
    quantity: 400,
    unitPriceUsd: 2.8,
    freightUsd: 150,
    dutiesUsd: 56,
    status: 'delivered',
    paymentStatus: 'paid',
    incoterm: 'CIF',
    trackingNumber: 'CMAU-2290641',
    carrier: 'CMA CGM',
    expectedOn: '2026-04-30',
    destination: { city: 'Newark', country: 'United States' },
    milestones: {
      placedOn: '2026-03-21',
      paidOn: '2026-03-21',
      productionOn: '2026-03-25',
      shippedOn: '2026-04-02',
      customsOn: '2026-04-22',
      deliveredOn: '2026-04-28',
    },
  },
  {
    id: 'ORD-2033',
    productId: 'prd-1003',
    supplierId: 'sup-xyz',
    quantity: 70,
    unitPriceUsd: 12.5,
    freightUsd: 120,
    dutiesUsd: 68,
    status: 'delivered',
    paymentStatus: 'paid',
    incoterm: 'FOB',
    trackingNumber: 'HLCU-7712094',
    carrier: 'Hapag-Lloyd',
    expectedOn: '2026-05-16',
    destination: { city: 'Felixstowe', country: 'United Kingdom' },
    milestones: {
      placedOn: '2026-04-09',
      paidOn: '2026-04-10',
      productionOn: '2026-04-14',
      shippedOn: '2026-04-23',
      customsOn: '2026-05-09',
      deliveredOn: '2026-05-14',
    },
  },
  {
    id: 'ORD-2034',
    productId: 'prd-1004',
    supplierId: 'sup-crafts',
    quantity: 80,
    unitPriceUsd: 8.9,
    freightUsd: 95,
    dutiesUsd: 33,
    status: 'delivered',
    paymentStatus: 'paid',
    incoterm: 'FOB',
    trackingNumber: 'DHL-889120344',
    carrier: 'DHL Global Forwarding',
    expectedOn: '2026-06-02',
    destination: { city: 'Osaka', country: 'Japan' },
    milestones: {
      placedOn: '2026-04-26',
      paidOn: '2026-04-26',
      productionOn: '2026-04-30',
      shippedOn: '2026-05-11',
      customsOn: '2026-05-26',
      deliveredOn: '2026-05-30',
    },
  },
  {
    id: 'ORD-2035',
    productId: 'prd-1005',
    supplierId: 'sup-crafts',
    quantity: 50,
    unitPriceUsd: 15.4,
    freightUsd: 130,
    dutiesUsd: 46,
    status: 'delivered',
    paymentStatus: 'paid',
    incoterm: 'CIF',
    trackingNumber: 'MAEU-4418902',
    carrier: 'Maersk',
    expectedOn: '2026-06-20',
    destination: { city: 'Dubai', country: 'United Arab Emirates' },
    milestones: {
      placedOn: '2026-05-12',
      paidOn: '2026-05-13',
      productionOn: '2026-05-18',
      shippedOn: '2026-05-29',
      customsOn: '2026-06-14',
      deliveredOn: '2026-06-18',
    },
  },
  {
    id: 'ORD-2036',
    productId: 'prd-1006',
    supplierId: 'sup-abc',
    quantity: 1900,
    unitPriceUsd: 1.1,
    freightUsd: 300,
    dutiesUsd: 63,
    status: 'delivered',
    paymentStatus: 'paid',
    incoterm: 'CFR',
    trackingNumber: 'CMAU-2291877',
    carrier: 'CMA CGM',
    expectedOn: '2026-07-04',
    destination: { city: 'Jebel Ali', country: 'United Arab Emirates' },
    milestones: {
      placedOn: '2026-05-29',
      paidOn: '2026-05-29',
      productionOn: '2026-06-03',
      shippedOn: '2026-06-12',
      customsOn: '2026-06-28',
      deliveredOn: '2026-07-02',
    },
  },
  {
    id: 'ORD-2037',
    productId: 'prd-1007',
    supplierId: 'sup-himalayan',
    quantity: 160,
    unitPriceUsd: 6.35,
    freightUsd: 140,
    dutiesUsd: 30,
    status: 'delivered',
    paymentStatus: 'paid',
    incoterm: 'CIF',
    trackingNumber: 'HLCU-7713551',
    carrier: 'Hapag-Lloyd',
    expectedOn: '2026-07-21',
    destination: { city: 'Melbourne', country: 'Australia' },
    milestones: {
      placedOn: '2026-06-15',
      paidOn: '2026-06-16',
      productionOn: '2026-06-19',
      shippedOn: '2026-06-27',
      customsOn: '2026-07-15',
      deliveredOn: '2026-07-19',
    },
  },
  {
    id: 'ORD-2038',
    productId: 'prd-1001',
    supplierId: 'sup-abc',
    quantity: 400,
    unitPriceUsd: 4.1,
    freightUsd: 230,
    dutiesUsd: 82,
    status: 'delivered',
    paymentStatus: 'paid',
    incoterm: 'CIF',
    trackingNumber: 'MAEU-4419774',
    carrier: 'Maersk',
    expectedOn: '2026-08-08',
    destination: { city: 'Rotterdam', country: 'Germany' },
    milestones: {
      placedOn: '2026-07-01',
      paidOn: '2026-07-01',
      productionOn: '2026-07-06',
      shippedOn: '2026-07-14',
      customsOn: '2026-08-01',
      deliveredOn: '2026-08-06',
    },
  },
  {
    id: 'ORD-2039',
    productId: 'prd-1003',
    supplierId: 'sup-xyz',
    quantity: 100,
    unitPriceUsd: 12.2,
    freightUsd: 180,
    dutiesUsd: 98,
    status: 'delivered',
    paymentStatus: 'paid',
    incoterm: 'FOB',
    trackingNumber: 'HLCU-7714228',
    carrier: 'Hapag-Lloyd',
    expectedOn: '2026-08-29',
    destination: { city: 'Sydney', country: 'Australia' },
    milestones: {
      placedOn: '2026-07-22',
      paidOn: '2026-07-23',
      productionOn: '2026-07-27',
      shippedOn: '2026-08-05',
      customsOn: '2026-08-23',
      deliveredOn: '2026-08-27',
    },
  },
  {
    id: 'ORD-2040',
    productId: 'prd-1005',
    supplierId: 'sup-crafts',
    quantity: 90,
    unitPriceUsd: 15.4,
    freightUsd: 190,
    dutiesUsd: 83,
    status: 'in-transit',
    paymentStatus: 'paid',
    incoterm: 'CIF',
    trackingNumber: 'MAEU-4421065',
    carrier: 'Maersk',
    expectedOn: '2026-10-02',
    destination: { city: 'Los Angeles', country: 'United States' },
    milestones: {
      placedOn: '2026-08-24',
      paidOn: '2026-08-24',
      productionOn: '2026-08-28',
      shippedOn: '2026-09-05',
      customsOn: null,
      deliveredOn: null,
    },
  },
  {
    id: 'ORD-2041',
    productId: 'prd-1007',
    supplierId: 'sup-himalayan',
    quantity: 220,
    unitPriceUsd: 6.35,
    freightUsd: 170,
    dutiesUsd: 42,
    status: 'in-transit',
    paymentStatus: 'paid',
    incoterm: 'CIF',
    trackingNumber: 'CMAU-2293410',
    carrier: 'CMA CGM',
    expectedOn: '2026-09-28',
    destination: { city: 'Hamburg', country: 'Germany' },
    milestones: {
      placedOn: '2026-08-30',
      paidOn: '2026-08-31',
      productionOn: '2026-09-02',
      shippedOn: '2026-09-10',
      customsOn: '2026-09-19',
      deliveredOn: null,
    },
  },
  {
    id: 'ORD-2042',
    productId: 'prd-1004',
    supplierId: 'sup-crafts',
    quantity: 120,
    unitPriceUsd: 8.9,
    freightUsd: 130,
    dutiesUsd: 64,
    status: 'processing',
    paymentStatus: 'paid',
    incoterm: 'FOB',
    trackingNumber: null,
    carrier: null,
    expectedOn: '2026-10-20',
    destination: { city: 'Tokyo', country: 'Japan' },
    milestones: {
      placedOn: '2026-08-16',
      paidOn: '2026-08-16',
      productionOn: null,
      shippedOn: null,
      customsOn: null,
      deliveredOn: null,
    },
  },
  {
    id: 'ORD-2043',
    productId: 'prd-1002',
    supplierId: 'sup-himalayan',
    quantity: 500,
    unitPriceUsd: 2.85,
    freightUsd: 200,
    dutiesUsd: 71,
    status: 'processing',
    paymentStatus: 'paid',
    incoterm: 'CIF',
    trackingNumber: null,
    carrier: null,
    expectedOn: '2026-10-14',
    destination: { city: 'Chicago', country: 'United States' },
    milestones: {
      placedOn: '2026-09-12',
      paidOn: '2026-09-12',
      productionOn: '2026-09-15',
      shippedOn: null,
      customsOn: null,
      deliveredOn: null,
    },
  },
  {
    id: 'ORD-2044',
    productId: 'prd-1003',
    supplierId: 'sup-xyz',
    quantity: 80,
    unitPriceUsd: 12.5,
    freightUsd: 150,
    dutiesUsd: 80,
    status: 'payment-failed',
    paymentStatus: 'payment-failed',
    incoterm: 'FOB',
    trackingNumber: null,
    carrier: null,
    expectedOn: '2026-10-26',
    destination: { city: 'Berlin', country: 'Germany' },
    milestones: {
      placedOn: '2026-09-18',
      paidOn: null,
      productionOn: null,
      shippedOn: null,
      customsOn: null,
      deliveredOn: null,
    },
  },
];

/** Status filter tabs for the order list. `null` means "no status filter". */
export const orderStatusFilters = [
  { id: 'all', label: 'All', status: null },
  { id: 'processing', label: 'Processing', status: 'processing' },
  { id: 'in-transit', label: 'In Transit', status: 'in-transit' },
  { id: 'delivered', label: 'Delivered', status: 'delivered' },
  { id: 'payment-failed', label: 'Payment Failed', status: 'payment-failed' },
];

/**
 * Ordered shipment stages every order moves through, paired with the milestone
 * field that marks the stage complete.
 */
export const orderStages = [
  { key: 'placedOn', label: 'Order Placed' },
  { key: 'paidOn', label: 'Payment Confirmed' },
  { key: 'productionOn', label: 'In Production' },
  { key: 'shippedOn', label: 'Shipped From Origin' },
  { key: 'customsOn', label: 'Customs Clearance' },
  { key: 'deliveredOn', label: 'Delivered' },
];

/**
 * @param {string} orderId
 * @returns {Order | undefined}
 */
export function findOrder(orderId) {
  return orders.find((order) => order.id === orderId);
}

export default orders;
