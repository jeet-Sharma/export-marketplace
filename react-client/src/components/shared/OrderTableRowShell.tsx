import type { ReactNode } from "react";
import { cellClassName } from "@/components/ui/Table";
import StatusPill from "@/components/vendor/StatusPill";
import { formatStatValue } from "@/lib/formatters";
import type { OrderStatus } from "@/types/status";

export interface OrderTableRowShellProps {
  id: string;
  product: string;
  /** The other party in the trade — see OrderRowShell for the same
   * buyer/supplier distinction, applied here to the full order table
   * instead of the dashboard preview. */
  counterpartyName: string;
  country: string;
  quantity: string;
  value: number;
  incoterm: string;
  placed: string;
  status: OrderStatus;
  action?: ReactNode;
}

// Shared row shell for the full order book/history table, used by both
// vendor/orders/OrderTable.tsx and buyer/orders/BuyerOrderTable.tsx. Same
// reasoning as OrderRowShell: the cell markup (columns, formatting,
// StatusPill) is identical across portals — only the counterparty field
// and the row's action button differ, and those are passed in.
export default function OrderTableRowShell({
  id,
  product,
  counterpartyName,
  country,
  quantity,
  value,
  incoterm,
  placed,
  status,
  action,
}: OrderTableRowShellProps) {
  return (
    <tr>
      <td className={`px-4 py-3 font-heading font-semibold ${cellClassName({ emphasis: true })}`}>
        {id}
      </td>
      <td className={`px-4 py-3 ${cellClassName()}`}>{product}</td>
      <td className={`px-4 py-3 ${cellClassName()}`}>
        <span>{counterpartyName}</span>
        <span className="text-text-dim"> ({country})</span>
      </td>
      <td className={`px-4 py-3 ${cellClassName()}`}>{quantity}</td>
      <td className={`px-4 py-3 font-heading font-medium ${cellClassName()}`}>
        {formatStatValue(value, "currency")}
      </td>
      <td className={`px-4 py-3 ${cellClassName()}`}>{incoterm}</td>
      <td className={`px-4 py-3 font-body ${cellClassName({ dim: true })}`}>{placed}</td>
      <td className={`px-4 py-3 ${cellClassName()}`}>
        <StatusPill status={status} />
      </td>
      <td className={`px-4 py-3 ${cellClassName()}`}>{action}</td>
    </tr>
  );
}
