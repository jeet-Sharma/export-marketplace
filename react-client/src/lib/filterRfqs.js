import matchesQuery from './matchesQuery';

/**
 * @typedef {import('@/data/rfq').Rfq & { product: import('@/data/products').Product | null }} RfqRecord
 *
 * @typedef {object} RfqFilters
 * @property {string} query
 * @property {string | null} status Null means "all statuses".
 */

/**
 * @param {RfqRecord[]} rfqs
 * @param {RfqFilters} filters
 * @returns {RfqRecord[]}
 */
export default function filterRfqs(rfqs, filters) {
  return rfqs.filter((rfq) => {
    const matchesText = matchesQuery(filters.query, [
      rfq.id,
      rfq.product?.name,
      rfq.product?.category,
      rfq.destinationCountry,
    ]);
    const matchesStatus = !filters.status || rfq.status === filters.status;

    return matchesText && matchesStatus;
  });
}

/**
 * Newest RFQ first.
 * @param {RfqRecord[]} rfqs
 * @returns {RfqRecord[]}
 */
export function sortRfqsByRecency(rfqs) {
  return [...rfqs].sort((a, b) => b.createdOn.localeCompare(a.createdOn));
}
