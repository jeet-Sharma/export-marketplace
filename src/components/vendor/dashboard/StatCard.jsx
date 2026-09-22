import Panel from "@/components/ui/Panel";
import { formatStatValue, formatDelta, trendFromDelta } from "@/lib/formatters";

// Single stat tile: label, big number, colored delta/note.
// teal for up, coral for down, dim for neutral.
// `value` is always raw (number or string); `format` says how to render it.
// `delta` is a raw signed number (percent points) or null; `note` is a plain
// text annotation ("2 pending") used instead of/alongside a numeric delta.
const DELTA_COLOR_CLASS = {
  up: "text-teal",
  down: "text-coral",
  neutral: "text-text-dim",
};

const DELTA_ARROW = {
  up: "\u2191", // ↑
  down: "\u2193", // ↓
  neutral: "",
};

export default function StatCard({
  label,
  value,
  format = "number",
  delta = null,
  deltaFormat = "percent",
  note,
  trend,
}) {
  const resolvedTrend = trend ?? trendFromDelta(delta);
  const deltaText = formatDelta(delta, deltaFormat);
  const arrow = DELTA_ARROW[resolvedTrend] ?? "";
  const deltaColorClass = DELTA_COLOR_CLASS[resolvedTrend] ?? "text-text-dim";

  return (
    <Panel bodyClassName="p-4">
      <p className="font-body text-text-dim text-[13px]">{label}</p>
      <p className="font-heading font-bold text-ink text-[28px] leading-[1.1] mt-2">
        {formatStatValue(value, format)}
      </p>
      {(deltaText || note) && (
        <p className={`font-heading font-medium text-[13px] mt-2 ${deltaColorClass}`}>
          {deltaText && (arrow ? `${arrow} ${deltaText}` : deltaText)}
          {deltaText && note ? " \u00B7 " : ""}
          {note}
        </p>
      )}
    </Panel>
  );
}
