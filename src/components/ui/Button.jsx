import colors from "@/theme/colors";

// Button variants:
// primary (navy fill), accent (saffron fill), ghost (transparent), danger (coral outline)
const VARIANTS = {
  primary: {
    backgroundColor: colors.ink,
    color: colors.panel,
    border: `1px solid ${colors.ink}`,
  },
  accent: {
    backgroundColor: colors.saffron,
    color: colors.panel,
    border: `1px solid ${colors.saffron}`,
  },
  ghost: {
    backgroundColor: "transparent",
    color: colors.text,
    border: `1px solid ${colors.line}`,
  },
  danger: {
    backgroundColor: "transparent",
    color: colors.coral,
    border: `1px solid ${colors.coral}`,
  },
};

const SIZES = {
  sm: { padding: "5px 10px", fontSize: "12px" },
  md: { padding: "8px 14px", fontSize: "13px" },
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  onClick,
  className = "",
  ...rest
}) {
  const variantStyle = VARIANTS[variant] ?? VARIANTS.primary;
  const sizeStyle = SIZES[size] ?? SIZES.md;

  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1 font-body font-medium transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 ${className}`}
      style={{
        ...variantStyle,
        ...sizeStyle,
        borderRadius: "3px",
        cursor: "pointer",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
