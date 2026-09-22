import cx from '@/lib/cx';

/**
 * Screen title, breadcrumb and primary actions.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.breadcrumb
 * @param {import('react').ReactNode} [props.actions]
 * @param {import('react').ReactNode} [props.meta] Extra detail under the title.
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function PageHeader({ title, breadcrumb, actions, meta, className }) {
  return (
    <header
      className={cx(
        'flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="font-heading text-[11px] uppercase tracking-[0.12em] text-textdim">
          {breadcrumb}
        </p>
        <h1 className="mt-1 font-heading text-xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {meta && <div className="mt-2">{meta}</div>}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
