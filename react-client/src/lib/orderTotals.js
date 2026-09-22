/**
 * @typedef {import('@/data/orders').Order} Order
 *
 * @typedef {object} OrderTotals
 * @property {number} goodsUsd
 * @property {number} freightUsd
 * @property {number} dutiesUsd
 * @property {number} totalUsd
 */

/**
 * Money breakdown for a single order.
 * @param {Order} order
 * @returns {OrderTotals}
 */
export default function orderTotals(order) {
  const goodsUsd = order.quantity * order.unitPriceUsd;
  return {
    goodsUsd,
    freightUsd: order.freightUsd,
    dutiesUsd: order.dutiesUsd,
    totalUsd: goodsUsd + order.freightUsd + order.dutiesUsd,
  };
}

/**
 * Lifetime spend counts settled orders only — a failed payment has not left the
 * buyer's account.
 * @param {Order[]} allOrders
 * @returns {number}
 */
export function lifetimeSpendUsd(allOrders) {
  return allOrders
    .filter((order) => order.paymentStatus === 'paid')
    .reduce((sum, order) => sum + orderTotals(order).totalUsd, 0);
}
