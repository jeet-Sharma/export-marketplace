// Generic surface container with sharp 3px corners and a hairline border.
// Optionally renders a header row with a title and trailing action slot.
export default function Panel({
  title,
  action,
  children,
  className = "",
  bodyClassName = "",
}) {
  return (
    <section className={`bg-panel border border-line rounded ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between px-4 py-3 border-b border-line">
          {title ? (
            <h3 className="font-heading font-semibold text-text text-[15px]">
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
