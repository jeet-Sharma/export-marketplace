import colors from "@/theme/colors";
import Panel from "@/components/ui/Panel";
import Table, { cellStyle } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/vendor/StatusPill";
import { inventoryMeta } from "@/data/inventory";

const COLUMNS = [
  "SKU",
  "Product",
  "Warehouse",
  "On Hand",
  "Reserved",
  "Available",
  "Threshold",
  "Status",
  "Action",
];

export default function InventoryTable({ items = [] }) {
  return (
    <Panel title={inventoryMeta.panelTitle}>
      <Table columns={COLUMNS} emptyMessage="No SKUs match your search.">
        {items.map((item) => {
          const available = item.onHand - item.reserved;
          const belowThreshold = available <= item.threshold;

          return (
            <tr key={item.id}>
              <td
                className="px-4 py-3 font-heading font-semibold"
                style={cellStyle({ color: colors.ink })}
              >
                {item.sku}
              </td>
              <td className="px-4 py-3" style={cellStyle()}>
                {item.product}
              </td>
              <td
                className="px-4 py-3"
                style={cellStyle({ color: colors.textDim })}
              >
                {item.warehouse}
              </td>
              <td
                className="px-4 py-3 font-heading font-medium"
                style={cellStyle()}
              >
                {item.onHand.toLocaleString()} {item.unit}
              </td>
              <td className="px-4 py-3" style={cellStyle()}>
                {item.reserved.toLocaleString()} {item.unit}
              </td>
              <td
                className="px-4 py-3 font-heading font-semibold"
                style={cellStyle({
                  color: belowThreshold ? colors.coral : colors.teal,
                })}
              >
                {available.toLocaleString()} {item.unit}
              </td>
              <td
                className="px-4 py-3"
                style={cellStyle({ color: colors.textDim })}
              >
                {item.threshold.toLocaleString()} {item.unit}
              </td>
              <td className="px-4 py-3" style={cellStyle()}>
                <StatusPill status={item.status} />
              </td>
              <td className="px-4 py-3" style={cellStyle()}>
                <Button
                  variant={belowThreshold ? "danger" : "ghost"}
                  size="sm"
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
