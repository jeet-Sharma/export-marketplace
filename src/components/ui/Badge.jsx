import colors from "@/theme/colors";

// Generic badge / pill. Pass explicit fg + bg tokens (from colors.js),
// or a `tone` shortcut. Defaults to a neutral line-bordered pill.
const TONES = {
  neutral: { fg: colors.textDim, bg: colors.paper },
  saffron: { fg: colors.saffron, bg: colors.saffronSoft },
  teal: { fg: colors.teal, bg: colors.tealSoft },
  blueGrey: { fg: colors.blueGrey, bg: colors.blueGreySoft },
  coral: { fg: colors.coral, bg: colors.coralSoft },
};

export default function Badge({
  children,
  tone = "neutral",
  fg,
  bg,
  className = "",
}) {
  const resolved = TONES[tone] ?? TONES.neutral;
  const color = fg ?? resolved.fg;
  const background = bg ?? resolved.bg;

  return (
    <span
      className={`inline-flex items-center gap-1 font-body font-medium ${className}`}
      style={{
        color,
        backgroundColor: background,
        borderRadius: "3px",
        padding: "3px 8px",
        fontSize: "12px",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
