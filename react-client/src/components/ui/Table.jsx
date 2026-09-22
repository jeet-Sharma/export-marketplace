import cx from '@/lib/cx';

/**
 * @typedef {object} TableColumn
 * @property {string} key
 * @property {string} label
 * @property {'left' | 'right' | 'center'} [align]
 * @property {string} [className] Width or visibility classes for the column.
 * @property {boolean} [labelHidden] Keeps the header cell for screen readers only.
 */

/** @type {Record<'left' | 'right' | 'center', string>} */
export const CELL_ALIGNMENT = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

/**
 * Dense data table. Scrolls horizontally on narrow viewports instead of
 * wrapping cells.
 *
 * @param {object} props
 * @param {TableColumn[]} props.columns
 * @param {import('react').ReactNode} props.children Rendered inside `tbody`.
 * @param {string} [props.caption] Accessible description of the table.
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function Table({ columns, children, caption, className }) {
  return (
    <div className="overflow-x-auto">
      <table className={cx('w-full min-w-3xl border-collapse text-sm', className)}>
        {caption && <caption className="sr-only">{caption}</caption>}

        <thead>
          <tr className="border-b border-line bg-paper">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx(
                  'px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-textdim',
                  CELL_ALIGNMENT[column.align ?? 'left'],
                  column.className,
                )}
              >
                <span className={cx(column.labelHidden && 'sr-only')}>{column.label}</span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
