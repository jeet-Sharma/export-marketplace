import colors from "@/theme/colors";
import Panel from "@/components/ui/Panel";

// Single stat tile: label, big number, colored delta.
// teal for up, coral for down, dim for neutral.
const DELTA_COLOR = {
  up: colors.teal,
  down: colors.coral,
  neutral: colors.textDim,
};

const DELTA_ARROW = {
  up: "\u2191", // ↑
  down: "\u2193", // ↓
  neutral: "",
};

export default function StatCard({ label, value, delta, trend = "neutral" }) {
  const deltaColor = DELTA_COLOR[trend] ?? colors.textDim;
  const arrow = DELTA_ARROW[trend] ?? "";

  return (
    <Panel bodyClassName="p-4">
      <p
        className="font-body"
        style={{ color: colors.textDim, fontSize: "13px" }}
      >
        {label}
      </p>
      <p
        className="font-heading font-bold mt-2"
        style={{ color: colors.ink, fontSize: "28px", lineHeight: 1.1 }}
      >
        {value}
      </p>
      <p
        className="font-heading font-medium mt-2"
        style={{ color: deltaColor, fontSize: "13px" }}
      >
        {arrow ? `${arrow} ` : ""}
        {delta}
      </p>
    </Panel>
  );
}
