import {
  defaultDutyRate,
  dutyRatesByCategory,
  shippingDestinations,
  shippingMethods,
} from '@/data/cart';

/**
 * @typedef {import('@/data/products').Product} Product
 * @typedef {import('@/data/cart').CartLine} CartLine
 *
 * @typedef {object} CartItem
 * @property {string} productId
 * @property {number} quantity
 * @property {Product} product
 * @property {number} subtotalUsd
 * @property {number} weightKg
 * @property {number} dutiesUsd
 * @property {boolean} belowMoq
 * @property {number} moqShortfall Units still needed to reach the MOQ.
 *
 * @typedef {object} CartTotals
 * @property {CartItem[]} items
 * @property {number} itemCount
 * @property {number} weightKg
 * @property {number} subtotalUsd
 * @property {number} freightUsd
 * @property {number} dutiesUsd
 * @property {number} totalUsd
 * @property {number | null} transitDays
 * @property {boolean} hasMoqIssue
 * @property {import('@/data/cart').ShippingDestination | null} destination
 * @property {(typeof shippingMethods)[number]} shippingMethod
 */

/** @param {string} country */
export function findDestination(country) {
  return shippingDestinations.find((destination) => destination.country === country) ?? null;
}

/** @param {string} methodId */
export function findShippingMethod(methodId) {
  return shippingMethods.find((method) => method.id === methodId) ?? shippingMethods[0];
}

/** @param {string} category */
function dutyRateFor(category) {
  return dutyRatesByCategory[category] ?? defaultDutyRate;
}

/**
 * Joins cart lines with catalogue products and derives the per-line figures.
 * Lines whose product is no longer in the catalogue are dropped.
 *
 * @param {CartLine[]} lines
 * @param {Product[]} products
 * @returns {CartItem[]}
 */
export function buildCartItems(lines, products) {
  return lines.flatMap((line) => {
    const product = products.find((candidate) => candidate.id === line.productId);
    if (!product) return [];

    const subtotalUsd = line.quantity * product.unitPriceUsd;

    return [
      {
        productId: line.productId,
        quantity: line.quantity,
        product,
        subtotalUsd,
        weightKg: line.quantity * product.unitWeightKg,
        dutiesUsd: subtotalUsd * dutyRateFor(product.category),
        belowMoq: line.quantity < product.moq,
        moqShortfall: Math.max(product.moq - line.quantity, 0),
      },
    ];
  });
}

/**
 * Full cart breakdown in USD.
 *
 * Freight is a fixed destination charge plus a per-kilogram rate, scaled by the
 * chosen shipping mode. Duties are an indicative figure derived from each
 * product's category tariff. Both are estimates until the forwarder confirms.
 *
 * @param {object} input
 * @param {CartLine[]} input.lines
 * @param {Product[]} input.products
 * @param {string} input.destinationCountry
 * @param {string} input.shippingMethodId
 * @returns {CartTotals}
 */
export default function cartTotals({
  lines,
  products,
  destinationCountry,
  shippingMethodId,
}) {
  const items = buildCartItems(lines, products);
  const destination = findDestination(destinationCountry);
  const shippingMethod = findShippingMethod(shippingMethodId);

  const subtotalUsd = items.reduce((sum, item) => sum + item.subtotalUsd, 0);
  const dutiesUsd = items.reduce((sum, item) => sum + item.dutiesUsd, 0);
  const weightKg = items.reduce((sum, item) => sum + item.weightKg, 0);

  const freightUsd =
    destination && items.length
      ? Math.round(
          (destination.baseFreightUsd + destination.perKgUsd * weightKg) *
            shippingMethod.freightMultiplier,
        )
      : 0;

  const transitDays = destination
    ? Math.max(destination.transitDays + shippingMethod.transitAdjustmentDays, 3)
    : null;

  return {
    items,
    itemCount: items.length,
    weightKg,
    subtotalUsd,
    freightUsd,
    dutiesUsd,
    totalUsd: subtotalUsd + freightUsd + dutiesUsd,
    transitDays,
    hasMoqIssue: items.some((item) => item.belowMoq),
    destination,
    shippingMethod,
  };
}
