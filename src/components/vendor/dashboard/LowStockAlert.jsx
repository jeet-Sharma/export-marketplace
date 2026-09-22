import colors from "@/theme/colors";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/vendor/StatusPill";

// Coral banner listing products that dropped below their stock threshold.
export default function LowStockAlert({ alerts = [] }) {
  if (alerts.length === 0) return null;

  return (
    <section
      className="p-4"
      style={{
        backgroundColor: colors.coralSoft,
        border: `1px solid ${colors.coral}`,
        borderRadius: "3px",
      }}
    >
      <div className="flex items-center gap-2">
        <StatusPill status="low" />
        <h3
          className="font-heading font-semibold"
          style={{ color: colors.coral, fontSize: "14px" }}
        >
          Low Stock Alert
        </h3>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <p
              className="font-body"
              style={{ color: colors.text, fontSize: "13px" }}
            >
              <span className="font-heading font-semibold">
                {alert.product}
              </span>
              {" — "}
              {alert.unitsLeft} units left
              <span style={{ color: colors.textDim }}>
                {" "}
                (threshold {alert.threshold})
              </span>
            </p>
            <Button variant="danger" size="sm">
              Restock
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
