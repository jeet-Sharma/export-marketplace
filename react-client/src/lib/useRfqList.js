'use client';

import { useCallback, useMemo, useState } from 'react';
import api from './api';
import useResource from './useResource';

/**
 * @typedef {import('./filterRfqs').RfqRecord} RfqRecord
 *
 * @typedef {object} NewRfqInput
 * @property {import('@/data/products').Product} product
 * @property {number} quantity
 * @property {number} targetPriceUsd
 * @property {string} destinationCountry
 * @property {string} notes
 */

/**
 * Next sequential RFQ reference, based on the highest existing one.
 * @param {RfqRecord[]} rfqs
 * @returns {string}
 */
function nextRfqId(rfqs) {
  const highest = rfqs.reduce((max, rfq) => {
    const numeric = Number.parseInt(rfq.id.replace(/\D/g, ''), 10);
    return Number.isNaN(numeric) ? max : Math.max(max, numeric);
  }, 1000);

  return `RFQ-${highest + 1}`;
}

/**
 * RFQ list with client-side submission.
 *
 * Submitted RFQs are held alongside the fetched ones so the list reflects them
 * immediately; a real implementation would POST and refetch instead.
 *
 * @returns {{
 *   rfqs: RfqRecord[],
 *   loading: boolean,
 *   error: Error | null,
 *   reload: () => void,
 *   submitRfq: (input: NewRfqInput) => void,
 * }}
 */
export default function useRfqList() {
  const { data, loading, error, reload } = useResource(api.getRfqs);
  const [submitted, setSubmitted] = useState(/** @type {RfqRecord[]} */([]));

  const rfqs = useMemo(() => [...submitted, ...(data ?? [])], [submitted, data]);

  const submitRfq = useCallback(
    /** @param {NewRfqInput} input */
    (input) => {
      setSubmitted((current) => {
        const known = [...current, ...(data ?? [])];

        return [
          {
            id: nextRfqId(known),
            productId: input.product.id,
            product: input.product,
            quantity: input.quantity,
            targetPriceUsd: input.targetPriceUsd,
            destinationCountry: input.destinationCountry,
            status: 'open',
            createdOn: new Date().toISOString().slice(0, 10),
            firstResponseDays: null,
            hasNewQuote: false,
            acceptedQuoteId: null,
            notes: input.notes,
            quotes: [],
          },
          ...current,
        ];
      });
    },
    [data],
  );

  return { rfqs, loading, error, reload, submitRfq };
}
