import { currencies } from '@/data/cart';

/**
 * @param {string} currencyCode
 * @returns {import('@/data/cart').Currency}
 */
export function findCurrency(currencyCode) {
  return currencies.find((currency) => currency.code === currencyCode) ?? currencies[0];
}

/**
 * Converts a USD amount into the buyer's display currency.
 * All stored money is USD; conversion happens at render time only.
 *
 * @param {number} amountUsd
 * @param {string} [currencyCode]
 * @returns {number}
 */
export default function convertCurrency(amountUsd, currencyCode = 'USD') {
  return amountUsd * findCurrency(currencyCode).rateFromUsd;
}
