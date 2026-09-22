import matchesQuery from './matchesQuery';

/**
 * @typedef {import('@/data/orders').Order & { product: import('@/data/products').Product | null, supplier: import('@/data/suppliers').Supplier | null }} OrderRecord
 *
 * @typedef {object} OrderFilters
 * @property {string} query
 * @property {string | null} status Null means "all statuses".
 */

/**
 * @param {OrderRecord[]} orders
 * @param {OrderFilters} filters
 * @returns {OrderRecord[]}
 */
export default function filterOrders(orders, filters) {
  return orders.filter((order) => {
    const matchesText = matchesQuery(filters.query, [
      order.id,
      order.product?.name,
      order.supplier?.name,
      order.destination.country,
      order.destination.city,
      order.trackingNumber,
    ]);
    const matchesStatus = !filters.status || order.status === filters.status;

    return matchesText && matchesStatus;
  });
}

/**
 * Most recently placed first.
 * @param {OrderRecord[]} orders
 * @returns {OrderRecord[]}
 */
export function sortOrdersByRecency(orders) {
  return [...orders].sort((a, b) =>
    b.milestones.placedOn.localeCompare(a.milestones.placedOn),
  );
}
