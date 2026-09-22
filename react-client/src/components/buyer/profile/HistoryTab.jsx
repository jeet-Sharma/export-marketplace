import Link from 'next/link';
import Panel from '@/components/ui/Panel';
import Table from '@/components/ui/Table';
import TableCell from '@/components/ui/TableCell';
import TableRow from '@/components/ui/TableRow';
import StatusPill from '@/components/buyer/StatusPill';
import formatDate from '@/lib/formatDate';
import formatCurrency from '@/lib/formatCurrency';

/** @type {import('@/components/ui/Table').TableColumn[]} */
const columns = [
  { key: 'date', label: 'Date' },
  { key: 'description', label: 'Description' },
  { key: 'method', label: 'Method' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'status', label: 'Status' },
];

/**
 * Past transactions table.
 * @param {object} props
 * @param {import('@/data/profile').Transaction[]} props.transactions
 * @returns {import('react').ReactElement}
 */
export default function HistoryTab({ transactions }) {
  return (
    <Panel title="Transaction History" padded={false}>
      <Table columns={columns} caption="Past transactions">
        {transactions.map((transaction, index) => (
          <TableRow key={transaction.id} last={index === transactions.length - 1}>
            <TableCell numeric dim>{formatDate(transaction.date)}</TableCell>
            <TableCell header>
              {transaction.description}
              <span className="mt-0.5 block font-body text-[11px] font-normal text-textdim">
                <Link href={`/orders/${transaction.orderId}`} className="hover:text-saffron">
                  {transaction.orderId}
                </Link>
              </span>
            </TableCell>
            <TableCell>{transaction.method}</TableCell>
            <TableCell align="right" numeric>{formatCurrency(transaction.amountUsd)}</TableCell>
            <TableCell>
              <StatusPill status={transaction.status} />
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </Panel>
  );
}
