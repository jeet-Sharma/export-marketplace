import type { ReactNode } from "react";
import { cellClassName } from "@/components/ui/Table";
import StatusPill from "@/components/vendor/StatusPill";
import type { OrderStatus } from "@/types/status";

export interface OrderRowShellProps {
  id: string;
  product: string;
  /** The other party in the trade — buyer.buyer (vendor's view) or
   * buyer.supplier (buyer's view). Rendered identically either way. */
  counterpartyName: string;
  country: string;
  status: OrderStatus;
  /** Lifecycle-specific action button(s) — Accept/Reject/Track/Invoice for
   * the vendor, Track/Invoice/Reorder for the buyer. Each portal owns its
   * own action logic; this shell only renders whatever is passed in. */
  actions?: ReactNode;
}

// Shared row shell for the dashboard's "recent orders" preview table, used
// by both vendor/dashboard/OrderRow.tsx and buyer/dashboard/BuyerOrderRow.tsx.
// The two portals' orders differ only in which counterparty field they
// show and which actions apply to which status — the cell markup itself
// (columns, alignment, StatusPill) is identical, so it lives here once.
export default function OrderRowShell({
  id,
  product,
  counterpartyName,
  country,
  status,
  actions,
}: OrderRowShellProps) {
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
      <td className={`px-4 py-3 ${cellClassName()}`}>
        <StatusPill status={status} />
      </td>
      <td className={`px-4 py-3 ${cellClassName()}`}>{actions}</td>
    </tr>
  );
}
