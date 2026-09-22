/**
 * Buyer company profile, addresses, payment methods and transaction history.
 *
 * @typedef {object} Address
 * @property {string} id
 * @property {string} label
 * @property {string} contactName
 * @property {string[]} lines
 * @property {string} country
 * @property {string} phone
 * @property {boolean} isDefault
 *
 * @typedef {object} PaymentMethod
 * @property {string} id
 * @property {string} label
 * @property {string} detail
 * @property {'bank' | 'card' | 'letter-of-credit'} kind
 * @property {boolean} isDefault
 *
 * @typedef {object} Transaction
 * @property {string} id
 * @property {string} date
 * @property {string} description
 * @property {string} orderId
 * @property {string} method
 * @property {number} amountUsd
 * @property {'paid' | 'payment-failed' | 'refunded'} status
 */

export const buyerProfile = {
  id: 'buyer-meridian',
  companyName: 'Meridian Foods Ltd.',
  initials: 'AS',
  contactName: 'Amara Silva',
  email: 'amara.silva@meridianfoods.com',
  country: 'Germany',
  preferredCurrency: 'USD',
  kycStatus: 'verified',
  rating: 4.7,
  reviewCount: 32,
  memberSince: '2024-02-17',
  importerCode: 'DE-IEC-4471902',
  annualVolumeUsd: 240000,
};

/** @type {Address[]} */
export const addresses = [
  {
    id: 'addr-hamburg',
    label: 'Hamburg Warehouse',
    contactName: 'Amara Silva',
    lines: ['Grosse Elbstrasse 142', 'Altona, 22767'],
    country: 'Germany',
    phone: '+49 40 5510 2280',
    isDefault: true,
  },
  {
    id: 'addr-berlin',
    label: 'Berlin Head Office',
    contactName: 'Jonas Brandt',
    lines: ['Friedrichstrasse 88', 'Mitte, 10117'],
    country: 'Germany',
    phone: '+49 30 4420 1177',
    isDefault: false,
  },
  {
    id: 'addr-rotterdam',
    label: 'Rotterdam Transit Hub',
    contactName: 'Lieke de Vries',
    lines: ['Waalhaven Oostzijde 21', '3087 BM'],
    country: 'Netherlands',
    phone: '+31 10 298 4410',
    isDefault: false,
  },
];

/** @type {PaymentMethod[]} */
export const paymentMethods = [
  {
    id: 'pay-wire',
    label: 'Wire Transfer',
    detail: 'Commerzbank · DE89 •••• 4471',
    kind: 'bank',
    isDefault: true,
  },
  {
    id: 'pay-card',
    label: 'Corporate Card',
    detail: 'Visa Business · •••• 8042',
    kind: 'card',
    isDefault: false,
  },
  {
    id: 'pay-lc',
    label: 'Letter of Credit',
    detail: 'Irrevocable LC at sight · Commerzbank',
    kind: 'letter-of-credit',
    isDefault: false,
  },
];

/** @type {Transaction[]} */
export const transactions = [
  {
    id: 'txn-9041',
    date: '2026-09-12',
    description: 'Order payment',
    orderId: 'ORD-2043',
    method: 'Wire Transfer',
    amountUsd: 1696,
    status: 'paid',
  },
  {
    id: 'txn-9038',
    date: '2026-09-18',
    description: 'Order payment',
    orderId: 'ORD-2044',
    method: 'Corporate Card',
    amountUsd: 1230,
    status: 'payment-failed',
  },
  {
    id: 'txn-9030',
    date: '2026-08-31',
    description: 'Order payment',
    orderId: 'ORD-2041',
    method: 'Wire Transfer',
    amountUsd: 1609,
    status: 'paid',
  },
  {
    id: 'txn-9024',
    date: '2026-08-24',
    description: 'Order payment',
    orderId: 'ORD-2040',
    method: 'Letter of Credit',
    amountUsd: 1659,
    status: 'paid',
  },
  {
    id: 'txn-9019',
    date: '2026-08-16',
    description: 'Order payment',
    orderId: 'ORD-2042',
    method: 'Wire Transfer',
    amountUsd: 1262,
    status: 'paid',
  },
  {
    id: 'txn-9004',
    date: '2026-07-23',
    description: 'Order payment',
    orderId: 'ORD-2039',
    method: 'Wire Transfer',
    amountUsd: 1498,
    status: 'paid',
  },
];

/** Profile tabs, in display order. */
export const profileTabs = [
  { id: 'profile', label: 'Profile' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'payment-methods', label: 'Payment Methods' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'history', label: 'History' },
];

/** Options for the profile form's country and currency selects. */
export const buyerCountries = [
  'Germany',
  'United States',
  'United Kingdom',
  'United Arab Emirates',
  'Japan',
  'Australia',
  'Netherlands',
];

export const supplierMatchingPromo = {
  title: 'AI Supplier Matching',
  description:
    'Share your sourcing requirements once and get ranked supplier matches based on category fit, export history and response time.',
  actionLabel: 'Find Matches',
  badgeLabel: 'Beta',
};

export const complianceItems = [
  {
    id: 'kyc',
    label: 'KYC Verification',
    detail: 'Business registration and importer code verified.',
    status: 'verified',
  },
  {
    id: 'importer-code',
    label: 'Importer Code',
    detail: 'On file and matched against customs records.',
    status: 'verified',
  },
  {
    id: 'tax-profile',
    label: 'Tax Profile',
    detail: 'VAT identification pending annual re-confirmation.',
    status: 'pending',
  },
];

export default buyerProfile;
