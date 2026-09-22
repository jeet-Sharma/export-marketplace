import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import TableCell from '@/components/ui/TableCell';
import TableRow from '@/components/ui/TableRow';
import EmptyState from '@/components/buyer/EmptyState';
import VerifiedBadge from '@/components/buyer/VerifiedBadge';
import { formatQuantity } from '@/lib/formatCurrency';
import formatDate from '@/lib/formatDate';
import formatMoney from '@/lib/formatMoney';
import findBestQuote from '@/lib/findBestQuote';

/** @type {import('@/components/ui/Table').TableColumn[]} */
const quoteColumns = [
  { key: 'supplier', label: 'Supplier' },
  { key: 'price', label: 'Price / Unit', align: 'right' },
  { key: 'delivery', label: 'Delivery', align: 'right' },
  { key: 'moq', label: 'MOQ', align: 'right' },
  { key: 'validity', label: 'Valid Until', align: 'right' },
  { key: 'action', label: 'Action', align: 'right' },
];

/**
 * Side-by-side supplier quotes. The lowest unit price is highlighted in teal.
 *
 * @param {object} props
 * @param {Array<import('@/data/rfq').Quote & { supplier: import('@/data/suppliers').Supplier | null }>} props.quotes
 * @param {string} props.unit
 * @param {string} props.currencyCode
 * @param {string | null} [props.acceptedQuoteId]
 * @returns {import('react').ReactElement}
 */
export default function QuoteCompareTable({
  quotes,
  unit,
  currencyCode,
  acceptedQuoteId = null,
}) {
  if (!quotes.length) {
    return (
      <EmptyState
        icon="clock"
        title="No quotes yet"
        description="Suppliers usually respond within two working days."
      />
    );
  }

  const bestQuoteId = findBestQuote(quotes);

  return (
    <Table columns={quoteColumns} caption="Supplier quotes for this request">
      {quotes.map((quote, index) => {
        const isBest = quote.id === bestQuoteId;
        const isAccepted = quote.id === acceptedQuoteId;

        return (
          <TableRow key={quote.id} highlighted={isBest} last={index === quotes.length - 1}>
            <TableCell header>
              <span className="flex flex-wrap items-center gap-1.5">
                {quote.supplier?.name ?? 'Unknown supplier'}
                {quote.supplier?.verified && <VerifiedBadge />}
              </span>
              <span className="mt-0.5 block font-body text-[11px] font-normal text-textdim">
                {quote.supplier?.location} · {quote.incoterm}
              </span>
            </TableCell>

            <TableCell align="right" numeric>
              {formatMoney(quote.pricePerUnitUsd, currencyCode, { decimals: 2 })}
              {isBest && (
                <Badge accent="teal" className="ml-1.5">
                  Best price
                </Badge>
              )}
            </TableCell>

            <TableCell align="right" numeric>
              {quote.deliveryDays} days
            </TableCell>

            <TableCell align="right" numeric>
              {formatQuantity(quote.moq, unit)}
            </TableCell>

            <TableCell align="right" numeric dim>
              {formatDate(quote.validUntil)}
            </TableCell>

            <TableCell align="right">
              {isAccepted ? (
                <Badge accent="teal" variant="outline">
                  Accepted
                </Badge>
              ) : (
                <Button variant={isBest ? 'teal' : 'ghost'}>Accept &amp; Order</Button>
              )}
            </TableCell>
          </TableRow>
        );
      })}
    </Table>
  );
}
