// Button variants:
// primary (navy fill), accent (saffron fill), ghost (transparent), danger (coral outline)
const VARIANT_CLASSES = {
  primary: "bg-ink text-panel border border-ink",
  accent: "bg-saffron text-panel border border-saffron",
  ghost: "bg-transparent text-text border border-line",
  danger: "bg-transparent text-coral border border-coral",
};

const SIZE_CLASSES = {
  sm: "px-[10px] py-[5px] text-[12px]",
  md: "px-[14px] py-[8px] text-[13px]",
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
  const variantClass = VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.primary;
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;

  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1 font-body font-medium leading-[1.2] whitespace-nowrap rounded cursor-pointer transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${sizeClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
