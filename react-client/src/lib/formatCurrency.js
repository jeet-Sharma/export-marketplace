/**
 * Formats a money amount for display.
 *
 * Fraction digits default to 2 for fractional amounts and 0 for whole amounts,
 * which matches how trade figures are quoted (unit price `$4.20`, order total
 * `$18,940`).
 *
 * @param {number} amount
 * @param {string} [currencyCode] ISO 4217 code, defaults to USD.
 * @param {{ decimals?: number }} [options]
 * @returns {string}
 */
export default function formatCurrency(amount, currencyCode = 'USD', options = {}) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const decimals =
    options.decimals ?? (Number.isInteger(safeAmount) ? 0 : 2);

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safeAmount);
}

/**
 * Formats a price together with its selling unit, e.g. `$4.20 / kg`.
 * @param {number} amount
 * @param {string} unit
 * @param {string} [currencyCode]
 * @returns {string}
 */
export function formatUnitPrice(amount, unit, currencyCode = 'USD') {
  return `${formatCurrency(amount, currencyCode, { decimals: 2 })} / ${unit}`;
}

/**
 * Formats a quantity with its unit, e.g. `500 kg`.
 * @param {number} quantity
 * @param {string} unit
 * @returns {string}
 */
export function formatQuantity(quantity, unit) {
  return `${new Intl.NumberFormat('en-US').format(quantity)} ${unit}`;
}
