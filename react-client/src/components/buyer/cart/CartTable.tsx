import Panel from "@/components/ui/Panel";
import Table, { cellClassName } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { cartMeta } from "@/data/buyerCart";
import { getLineTotal } from "@/lib/cart";
import { formatStatValue } from "@/lib/formatters";
import type { CartItem } from "@/types/cart";

const COLUMNS = ["Product", "Supplier", "Unit Price", "Quantity", "Total", "Action"];

export interface CartTableProps {
  items?: CartItem[];
  onQuantityChange?: (item: CartItem, quantity: number) => void;
  onRemove?: (item: CartItem) => void;
}

// Cart line items — same Table/cellClassName shell every vendor table
// screen uses (OrderTable.tsx, RfqTable.tsx etc), with an inline quantity
// Input per row since the cart is the one table in this app where a cell
// value needs to be directly editable.
export default function CartTable({ items = [], onQuantityChange, onRemove }: CartTableProps) {
  return (
    <Panel title={cartMeta.panelTitle}>
      <Table columns={COLUMNS} caption={cartMeta.panelTitle} emptyMessage={cartMeta.emptyMessage}>
        {items.map((item) => (
          <tr key={item.id}>
            <td className={`px-4 py-3 ${cellClassName({ emphasis: true })}`}>
              <span className="mr-2" aria-hidden="true">
                {item.emoji}
              </span>
              {item.name}
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>{item.supplierName}</td>
            <td className={`px-4 py-3 ${cellClassName()}`}>
              {formatStatValue(item.unitPrice, "currency")}
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>
              <Input
                id={`cart-quantity-${item.id}`}
                type="number"
                min={1}
                value={item.quantity}
                onChange={(event) =>
                  onQuantityChange?.(item, Math.max(1, Number(event.target.value) || 1))
                }
                className="w-24"
                aria-label={`Quantity for ${item.name}`}
              />
            </td>
            <td
              className={`px-4 py-3 font-heading font-medium ${cellClassName()}`}
            >
              {formatStatValue(getLineTotal(item), "currency")}
            </td>
            <td className={`px-4 py-3 ${cellClassName()}`}>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onRemove?.(item)}
                disabled={!onRemove}
              >
                Remove
              </Button>
            </td>
          </tr>
        ))}
      </Table>
    </Panel>
  );
}
