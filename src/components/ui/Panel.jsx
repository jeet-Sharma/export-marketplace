import colors from "@/theme/colors";

// Generic surface container with sharp 3px corners and a hairline border.
// Optionally renders a header row with a title and trailing action slot.
export default function Panel({
  title,
  action,
  children,
  className = "",
  bodyClassName = "",
  style = {},
}) {
  return (
    <section
      className={className}
      style={{
        backgroundColor: colors.panel,
        border: `1px solid ${colors.line}`,
        borderRadius: "3px",
        ...style,
      }}
    >
      {(title || action) && (
        <header
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${colors.line}` }}
        >
          {title ? (
            <h3
              className="font-heading font-semibold"
              style={{ color: colors.text, fontSize: "15px" }}
            >
              {title}
            </h3>
          ) : (
            <span />
          )}
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
