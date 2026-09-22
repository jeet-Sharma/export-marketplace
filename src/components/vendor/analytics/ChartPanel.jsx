import colors from "@/theme/colors";
import Panel from "@/components/ui/Panel";

// Vertical bar chart drawn as plain SVG so the project takes on no chart
// dependency. Scale is derived from the data, so seed values can change
// freely without touching this component.
export function BarChart({ title, data = [], valuePrefix = "" }) {
  const max = data.reduce((peak, point) => Math.max(peak, point.value), 0) || 1;

  return (
    <Panel title={title} bodyClassName="p-4">
      <div
        className="flex items-end gap-2"
        style={{ height: "180px" }}
        role="img"
        aria-label={`${title}: ${data
          .map((d) => `${d.label} ${valuePrefix}${d.value}`)
          .join(", ")}`}
      >
        {data.map((point) => {
          const heightPct = (point.value / max) * 100;
          return (
            <div
              key={point.label}
              className="flex flex-1 flex-col items-center justify-end gap-2"
              style={{ height: "100%" }}
            >
              <span
                className="font-heading font-medium"
                style={{ color: colors.textDim, fontSize: "10px" }}
              >
                {Math.round(point.value / 1000)}k
              </span>
              <div
                style={{
                  width: "100%",
                  height: `${heightPct}%`,
                  backgroundColor: colors.saffron,
                  borderRadius: "3px 3px 0 0",
                  minHeight: "2px",
                }}
              />
              <span
                className="font-body"
                style={{ color: colors.textDim, fontSize: "11px" }}
              >
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

// Horizontal ranked bars, used for share-of-revenue style breakdowns.
export function RankedBars({ title, data = [], suffix = "%" }) {
  const max = data.reduce((peak, point) => Math.max(peak, point.value), 0) || 1;

  return (
    <Panel title={title} bodyClassName="p-4">
      <ul className="flex flex-col gap-3">
        {data.map((point) => (
          <li key={point.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span
                className="font-body"
                style={{ color: colors.text, fontSize: "13px" }}
              >
                {point.label}
              </span>
              <span
                className="font-heading font-semibold"
                style={{ color: colors.ink, fontSize: "13px" }}
              >
                {point.value}
                {suffix}
              </span>
            </div>
            <div
              style={{
                backgroundColor: colors.paper,
                border: `1px solid ${colors.line}`,
                borderRadius: "3px",
                height: "8px",
                width: "100%",
              }}
            >
              <div
                style={{
                  backgroundColor: colors.teal,
                  height: "100%",
                  width: `${(point.value / max) * 100}%`,
                  borderRadius: "3px",
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
