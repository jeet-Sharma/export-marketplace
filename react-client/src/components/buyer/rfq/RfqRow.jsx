import Link from 'next/link';
import Button from '@/components/ui/Button';
import TableCell from '@/components/ui/TableCell';
import TableRow from '@/components/ui/TableRow';
import ProductIdentity from '@/components/buyer/ProductIdentity';
import StatusPill from '@/components/buyer/StatusPill';
import { actionLabels } from '@/data/seedData';
import { formatQuantity } from '@/lib/formatCurrency';
import formatDate from '@/lib/formatDate';
import formatMoney from '@/lib/formatMoney';

/** @type {import('@/components/ui/Table').TableColumn[]} */
export const rfqColumns = [
  { key: 'rfq', label: 'RFQ' },
  { key: 'product', label: 'Product' },
  { key: 'quantity', label: 'Quantity', align: 'right' },
  { key: 'target', label: 'Target Price', align: 'right' },
  { key: 'destination', label: 'Destination' },
  { key: 'status', label: 'Status' },
  { key: 'action', label: 'Action', align: 'right' },
];

/**
 * @param {object} props
 * @param {import('@/lib/filterRfqs').RfqRecord} props.rfq
 * @param {string} props.currencyCode
 * @param {boolean} props.comparing Whether the quote table is expanded below.
 * @param {(rfqId: string) => void} props.onToggleCompare
 * @param {boolean} [props.last]
 * @returns {import('react').ReactElement}
 */
export default function RfqRow({
  rfq,
  currencyCode,
  comparing,
  onToggleCompare,
  last = false,
}) {
  const unit = rfq.product?.unit ?? 'units';
  const hasQuotes = rfq.quotes.length > 0;

  return (
    <TableRow last={last}>
      <TableCell header numeric>
        <Link href={`/rfq/${rfq.id}`} className="hover:text-saffron">
          {rfq.id}
        </Link>
        <span className="mt-0.5 block font-body text-[11px] font-normal text-textdim">
          {formatDate(rfq.createdOn)}
        </span>
      </TableCell>

      <TableCell>
        <ProductIdentity
          name={rfq.product?.name ?? rfq.productId}
          note={rfq.product?.category}
          size="sm"
        />
      </TableCell>

      <TableCell align="right" numeric>
        {formatQuantity(rfq.quantity, unit)}
      </TableCell>

      <TableCell align="right" numeric>
        {formatMoney(rfq.targetPriceUsd, currencyCode, { decimals: 2 })}
      </TableCell>

      <TableCell>{rfq.destinationCountry}</TableCell>

      <TableCell>
        <StatusPill status={rfq.status} />
      </TableCell>

      <TableCell align="right">
        {hasQuotes ? (
          <Button
            variant={comparing ? 'subtle' : 'ghost'}
            pressed={comparing}
            onClick={() => onToggleCompare(rfq.id)}
          >
            {actionLabels.compare}
          </Button>
        ) : (
          <Button href={`/rfq/${rfq.id}`} variant="subtle">
            {actionLabels.view}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
