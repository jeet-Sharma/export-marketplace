/**
 * Status → accent mapping shared by orders, RFQs, payments and shipments.
 *
 * Buyer-side semantics:
 *   saffron  — waiting on someone (pending, processing, awaiting quotes)
 *   teal     — good outcome (delivered, quoted, verified, paid)
 *   blueGrey — in motion or archived (in transit, shipped, closed)
 *   coral    — needs attention (payment failed, cancelled, rejected)
 *
 * @typedef {import('@/theme/colors').AccentToken} AccentToken
 */

/** @type {Record<string, AccentToken>} */
export const statusAccents = {
  pending: 'saffron',
  processing: 'saffron',
  'awaiting-quotes': 'saffron',
  open: 'saffron',
  unpaid: 'saffron',

  delivered: 'teal',
  quoted: 'teal',
  verified: 'teal',
  paid: 'teal',
  completed: 'teal',

  'in-transit': 'blueGrey',
  shipped: 'blueGrey',
  closed: 'blueGrey',
  draft: 'blueGrey',

  'payment-failed': 'coral',
  cancelled: 'coral',
  rejected: 'coral',
  overdue: 'coral',
};

const LABEL_OVERRIDES = {
  'awaiting-quotes': 'Awaiting Quotes',
  'in-transit': 'In Transit',
  'payment-failed': 'Payment Failed',
};

/**
 * Accent token for a status value.
 * @param {string} status
 * @returns {AccentToken}
 */
export default function statusColor(status) {
  return statusAccents[status] ?? 'blueGrey';
}

/**
 * Human-readable label for a status value.
 * @param {string} status
 * @returns {string}
 */
export function statusLabel(status) {
  if (!status) return '—';
  if (status in LABEL_OVERRIDES) return LABEL_OVERRIDES[status];
  return status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
