import cx from '@/lib/cx';

/**
 * Hairline-bordered surface used for every block of content.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {import('react').ReactNode} [props.action] Rendered in the header, right aligned.
 * @param {import('react').ReactNode} [props.footer]
 * @param {boolean} [props.padded] Set false when the body is a table or list.
 * @param {string} [props.className]
 * @param {string} [props.bodyClassName]
 * @returns {import('react').ReactElement}
 */
export default function Panel({
  children,
  title,
  description,
  action,
  footer,
  padded = true,
  className,
  bodyClassName,
}) {
  return (
    <section className={cx('rounded-sharp border border-line bg-panel', className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate font-heading text-sm font-semibold text-text">{title}</h2>
            )}
            {description && <p className="mt-0.5 text-xs text-textdim">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}

      <div className={cx(padded && 'p-4', bodyClassName)}>{children}</div>

      {footer && <footer className="border-t border-line px-4 py-3">{footer}</footer>}
    </section>
  );
}
