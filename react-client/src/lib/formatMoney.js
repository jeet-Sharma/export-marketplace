import convertCurrency from './convertCurrency';
import formatCurrency from './formatCurrency';

/**
 * Converts a stored USD amount into the active display currency and formats it.
 * Use this for anything that comes out of the data layer; use `formatCurrency`
 * directly only when the amount is already in the target currency.
 *
 * @param {number} amountUsd
 * @param {string} [currencyCode]
 * @param {{ decimals?: number }} [options]
 * @returns {string}
 */
export default function formatMoney(amountUsd, currencyCode = 'USD', options = {}) {
  return formatCurrency(convertCurrency(amountUsd, currencyCode), currencyCode, options);
}

/**
 * Formats a stored USD price with its selling unit in the display currency,
 * e.g. `€3.86 / kg`.
 *
 * @param {number} amountUsd
 * @param {string} unit
 * @param {string} [currencyCode]
 * @returns {string}
 */
export function formatUnitMoney(amountUsd, unit, currencyCode = 'USD') {
  return `${formatMoney(amountUsd, currencyCode, { decimals: 2 })} / ${unit}`;
}
