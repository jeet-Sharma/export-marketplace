import Panel from "@/components/ui/Panel";
import Table, { cellClassName } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/vendor/StatusPill";
import { inventoryMeta } from "@/data/inventory";
import type { InventoryItem } from "@/types/inventory";

export interface InventoryTableProps {
  items?: InventoryItem[];
  onRestock?: (item: InventoryItem) => void;
  onAdjust?: (item: InventoryItem) => void;
}

export default function InventoryTable({ items = [], onRestock, onAdjust }: InventoryTableProps) {
  return (
    <Panel title={inventoryMeta.panelTitle}>
      <Table
        columns={[
          "SKU",
          "Product",
          "Warehouse",
          "On Hand",
          "Reserved",
          "Available",
          "Threshold",
          "Status",
          "Action",
        ]}
        caption={inventoryMeta.panelTitle}
        emptyMessage="No SKUs match your search."
      >
        {items.map((item) => {
          const available = item.onHand - item.reserved;
          const belowThreshold = available <= item.threshold;
          const availableColorClass = belowThreshold ? "text-coral" : "text-teal";

          return (
            <tr key={item.id}>
              <td
                className={`px-4 py-3 font-heading font-semibold ${cellClassName({ emphasis: true })}`}
              >
                {item.sku}
              </td>
              <td className={`px-4 py-3 ${cellClassName()}`}>{item.product}</td>
              <td className={`px-4 py-3 ${cellClassName({ dim: true })}`}>
                {item.warehouse}
              </td>
              <td
                className={`px-4 py-3 font-heading font-medium ${cellClassName()}`}
              >
                {item.onHand.toLocaleString()} {item.unit}
              </td>
              <td className={`px-4 py-3 ${cellClassName()}`}>
                {item.reserved.toLocaleString()} {item.unit}
              </td>
              <td
                className={`px-4 py-3 font-heading font-semibold ${cellClassName({ extra: availableColorClass })}`}
              >
                {available.toLocaleString()} {item.unit}
              </td>
              <td className={`px-4 py-3 ${cellClassName({ dim: true })}`}>
                {item.threshold.toLocaleString()} {item.unit}
              </td>
              <td className={`px-4 py-3 ${cellClassName()}`}>
                <StatusPill status={item.status} />
              </td>
              <td className={`px-4 py-3 ${cellClassName()}`}>
                <Button
                  variant={belowThreshold ? "danger" : "ghost"}
                  size="sm"
                  onClick={() => (belowThreshold ? onRestock?.(item) : onAdjust?.(item))}
                  disabled={belowThreshold ? !onRestock : !onAdjust}
                >
                  {belowThreshold ? "Restock" : "Adjust"}
                </Button>
              </td>
            </tr>
          );
        })}
      </Table>
    </Panel>
  );
}
