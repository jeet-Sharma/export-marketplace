'use client';

import { Fragment, useState } from 'react';
import Table from '@/components/ui/Table';
import TableCell from '@/components/ui/TableCell';
import TableRow from '@/components/ui/TableRow';
import QuoteCompareTable from './QuoteCompareTable';
import RfqRow, { rfqColumns } from './RfqRow';

/**
 * RFQ list. Selecting "Compare" expands the supplier quotes inline beneath the
 * row; only one comparison is open at a time.
 *
 * @param {object} props
 * @param {import('@/lib/filterRfqs').RfqRecord[]} props.rfqs
 * @param {string} props.currencyCode
 * @returns {import('react').ReactElement}
 */
export default function RfqTable({ rfqs, currencyCode }) {
  const [comparingId, setComparingId] = useState(/** @type {string | null} */ (null));

  const toggleCompare = (rfqId) =>
    setComparingId((current) => (current === rfqId ? null : rfqId));

  return (
    <Table columns={rfqColumns} caption="Requests for quotation">
      {rfqs.map((rfq, index) => {
        const comparing = comparingId === rfq.id;
        const isLast = index === rfqs.length - 1;

        return (
          <Fragment key={rfq.id}>
            <RfqRow
              rfq={rfq}
              currencyCode={currencyCode}
              comparing={comparing}
              onToggleCompare={toggleCompare}
              last={isLast && !comparing}
            />

            {comparing && (
              <TableRow last={isLast}>
                <TableCell colSpan={rfqColumns.length} className="bg-paper px-4 py-3">
                  <p className="mb-2 font-heading text-[11px] font-semibold uppercase tracking-wide text-textdim">
                    Quotes for {rfq.id}
                  </p>
                  <div className="rounded-sharp border border-line bg-panel">
                    <QuoteCompareTable
                      quotes={rfq.quotes}
                      unit={rfq.product?.unit ?? 'units'}
                      currencyCode={currencyCode}
                      acceptedQuoteId={rfq.acceptedQuoteId}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )}
          </Fragment>
        );
      })}
    </Table>
  );
}
