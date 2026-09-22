import { lifetimeSpendUsd } from './orderTotals';

/**
 * @typedef {import('@/data/orders').Order} Order
 *
 * @typedef {object} OrderStats
 * @property {number} total
 * @property {number} processing
 * @property {number} inTransit
 * @property {number} active        Processing plus in transit.
 * @property {number} delivered
 * @property {number} paymentIssues
 * @property {number} totalSpendUsd
 * @property {number} placedInLatestMonth
 */

/**
 * Number of orders placed in the most recent month present in the data set.
 * Anchoring to the data (rather than the wall clock) keeps the figure stable.
 * @param {Order[]} orders
 * @returns {number}
 */
function countPlacedInLatestMonth(orders) {
  const months = orders.map((order) => order.milestones.placedOn.slice(0, 7));
  const latestMonth = months.reduce((latest, month) => (month > latest ? month : latest), '');
  return months.filter((month) => month === latestMonth).length;
}

/**
 * @param {Order[]} orders
 * @returns {OrderStats}
 */
export default function orderStats(orders) {
  const countByStatus = (status) => orders.filter((order) => order.status === status).length;

  const processing = countByStatus('processing');
  const inTransit = countByStatus('in-transit');

  return {
    total: orders.length,
    processing,
    inTransit,
    active: processing + inTransit,
    delivered: countByStatus('delivered'),
    paymentIssues: countByStatus('payment-failed'),
    totalSpendUsd: lifetimeSpendUsd(orders),
    placedInLatestMonth: countPlacedInLatestMonth(orders),
  };
}
