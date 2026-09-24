import Button from "@/components/ui/Button";
import StatusPill from "@/components/vendor/StatusPill";
import type { LowStockAlert as LowStockAlertItem } from "@/types/inventory";

export interface LowStockAlertProps {
  alerts?: LowStockAlertItem[];
  onRestock?: (alert: LowStockAlertItem) => void;
}

// Coral banner listing products that dropped below their stock threshold.
export default function LowStockAlert({ alerts = [], onRestock }: LowStockAlertProps) {
  if (alerts.length === 0) return null;

  return (
    <section className="p-4 bg-coral-soft border border-coral rounded">
      <div className="flex items-center gap-2">
        <StatusPill status="low" />
        <h3 className="font-heading font-semibold text-coral text-[14px]">
          Low Stock Alert
        </h3>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="font-body text-text text-[13px]">
              <span className="font-heading font-semibold">
                {alert.product}
              </span>
              {" — "}
              {alert.unitsLeft} units left
              <span className="text-text-dim"> (threshold {alert.threshold})</span>
            </p>
            <Button variant="danger" size="sm" onClick={() => onRestock?.(alert)}>
              Restock
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
