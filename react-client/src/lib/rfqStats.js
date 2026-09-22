/**
 * @typedef {import('@/data/rfq').Rfq} Rfq
 *
 * @typedef {object} RfqStats
 * @property {number} open
 * @property {number} quoted
 * @property {number} closed
 * @property {number} newQuotes
 * @property {number | null} avgResponseDays Null until at least one RFQ has a response.
 */

/**
 * @param {Rfq[]} rfqs
 * @returns {RfqStats}
 */
export default function rfqStats(rfqs) {
  const countByStatus = (status) => rfqs.filter((rfq) => rfq.status === status).length;

  // Average is taken over RFQs that actually received a quote, so unanswered
  // requests do not drag the response time down.
  const responseTimes = rfqs
    .map((rfq) => rfq.firstResponseDays)
    .filter((days) => typeof days === 'number');

  return {
    open: countByStatus('open'),
    quoted: countByStatus('quoted'),
    closed: countByStatus('closed'),
    newQuotes: rfqs.filter((rfq) => rfq.hasNewQuote).length,
    avgResponseDays: responseTimes.length
      ? responseTimes.reduce((sum, days) => sum + days, 0) / responseTimes.length
      : null,
  };
}
