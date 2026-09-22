/**
 * Cart and checkout reference data.
 *
 * The cart holds only `productId` + `quantity`. Every money figure (line
 * subtotal, freight, duties, order total, currency conversion) is derived in
 * `lib/cartTotals.js`.
 *
 * @typedef {object} CartLine
 * @property {string} productId
 * @property {number} quantity
 *
 * @typedef {object} ShippingDestination
 * @property {string} country
 * @property {number} baseFreightUsd Fixed handling and documentation charge.
 * @property {number} perKgUsd       Variable charge per gross kilogram.
 * @property {number} transitDays    Port-to-port sea transit estimate.
 *
 * @typedef {object} Currency
 * @property {string} code
 * @property {string} label
 * @property {number} rateFromUsd
 */

/**
 * Lines the buyer already has in the cart.
 * The bed linen line is deliberately below its MOQ so the validation path is
 * visible without needing a backend.
 * @type {CartLine[]}
 */
export const cartSeedLines = [
  { productId: 'prd-1001', quantity: 300 },
  { productId: 'prd-1003', quantity: 30 },
  { productId: 'prd-1007', quantity: 150 },
];

/** @type {ShippingDestination[]} */
export const shippingDestinations = [
  { country: 'United States', baseFreightUsd: 320, perKgUsd: 1.15, transitDays: 26 },
  { country: 'Germany', baseFreightUsd: 280, perKgUsd: 0.95, transitDays: 22 },
  { country: 'United Kingdom', baseFreightUsd: 295, perKgUsd: 1.02, transitDays: 24 },
  { country: 'United Arab Emirates', baseFreightUsd: 180, perKgUsd: 0.62, transitDays: 12 },
  { country: 'Japan', baseFreightUsd: 340, perKgUsd: 1.25, transitDays: 20 },
  { country: 'Australia', baseFreightUsd: 360, perKgUsd: 1.35, transitDays: 28 },
];

/**
 * Indicative import duty by product category, applied to the goods value.
 * Real duty depends on the HS code and destination tariff schedule, so this is
 * shown as an estimate only.
 */
export const dutyRatesByCategory = {
  Spices: 0.05,
  Textiles: 0.08,
  Handicrafts: 0.06,
  Agriculture: 0.03,
};

/** Fallback rate for categories without a specific tariff entry. */
export const defaultDutyRate = 0.05;

/** @type {Currency[]} */
export const currencies = [
  { code: 'USD', label: 'US Dollar', rateFromUsd: 1 },
  { code: 'EUR', label: 'Euro', rateFromUsd: 0.92 },
  { code: 'GBP', label: 'Pound Sterling', rateFromUsd: 0.79 },
  { code: 'AED', label: 'UAE Dirham', rateFromUsd: 3.67 },
  { code: 'INR', label: 'Indian Rupee', rateFromUsd: 88.4 },
];

/** Shipping methods offered at checkout. Freight scales off the sea rate. */
export const shippingMethods = [
  {
    id: 'sea-fcl',
    label: 'Sea Freight (FCL)',
    description: 'Full container load, port to port.',
    freightMultiplier: 1,
    transitAdjustmentDays: 0,
  },
  {
    id: 'air',
    label: 'Air Freight',
    description: 'Airport to airport, consolidated.',
    freightMultiplier: 2.4,
    transitAdjustmentDays: -14,
  },
  {
    id: 'express',
    label: 'Express Courier',
    description: 'Door to door with customs brokerage.',
    freightMultiplier: 3.2,
    transitAdjustmentDays: -18,
  },
];

/** Checkout wizard steps, in order. */
export const checkoutSteps = [
  { id: 'address', label: 'Address', description: 'Where the shipment is delivered.' },
  {
    id: 'shipping-payment',
    label: 'Shipping & Payment',
    description: 'Freight mode, payment method and settlement currency.',
  },
  { id: 'review', label: 'Review', description: 'Confirm the order and documents.' },
];

/** Export documents issued once payment clears. */
export const documentChecklist = [
  {
    id: 'doc-commercial-invoice',
    name: 'Commercial Invoice',
    description: 'Declared value, Incoterm and payment terms for customs.',
    status: 'Will be generated after payment',
  },
  {
    id: 'doc-shipping-bill',
    name: 'Shipping Bill',
    description: 'Filed by the exporter with Indian customs at the port of loading.',
    status: 'Will be generated after payment',
  },
  {
    id: 'doc-certificate-of-origin',
    name: 'Certificate of Origin',
    description: 'Confirms Indian origin for preferential duty treatment.',
    status: 'Will be generated after payment',
  },
];

export const cartCopy = {
  emptyTitle: 'Your cart is empty',
  emptyDescription: 'Add products from the catalogue to start building an order.',
  moqWarning: 'Below supplier minimum order quantity',
};

export default cartSeedLines;

export const checkoutCopy = {
  documentsTitle: 'Document Checklist',
  documentsDescription:
    'Export paperwork is prepared by the supplier once the payment has cleared.',
  placedTitle: 'Order submitted',
  placedDescription:
    'The supplier has been notified. Track progress from your order history once payment clears.',
  addAddressLabel: 'Add a new address',
};
