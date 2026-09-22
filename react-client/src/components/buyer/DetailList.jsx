import cx from '@/lib/cx';

/**
 * @typedef {object} DetailItem
 * @property {string} label
 * @property {import('react').ReactNode} value
 * @property {boolean} [strong] Emphasises the value, e.g. a grand total.
 * @property {boolean} [numeric]
 */

/**
 * Label / value description list. Shared by order summaries, cart totals and
 * the checkout review step so those blocks stay visually identical.
 *
 * @param {object} props
 * @param {DetailItem[]} props.items
 * @param {'rows' | 'grid'} [props.variant] `grid` pairs items two per row.
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function DetailList({ items, variant = 'rows', className }) {
  return (
    <dl
      className={cx(
        variant === 'grid' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'divide-y divide-line',
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={cx(
            variant === 'grid'
              ? 'space-y-0.5'
              : 'flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0',
          )}
        >
          <dt className="text-[11px] font-medium uppercase tracking-wide text-textdim">
            {item.label}
          </dt>
          <dd
            className={cx(
              'text-sm',
              item.numeric && 'font-heading tabular-nums',
              item.strong ? 'font-semibold text-ink' : 'text-text',
              variant === 'rows' && 'text-right',
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
