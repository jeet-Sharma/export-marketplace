/**
 * Lowest unit price wins. Ties are broken by the shorter delivery time, since
 * that is the next thing a buyer compares on.
 *
 * @param {Array<{ id: string, pricePerUnitUsd: number, deliveryDays: number }>} quotes
 * @returns {string | null} Id of the best quote, or null for an empty list.
 */
export default function findBestQuote(quotes) {
  if (!quotes.length) return null;

  return quotes.reduce((best, quote) => {
    if (quote.pricePerUnitUsd < best.pricePerUnitUsd) return quote;
    if (
      quote.pricePerUnitUsd === best.pricePerUnitUsd &&
      quote.deliveryDays < best.deliveryDays
    ) {
      return quote;
    }
    return best;
  }).id;
}
