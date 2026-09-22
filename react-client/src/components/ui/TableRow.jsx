import cx from '@/lib/cx';

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {boolean} [props.highlighted] Tints the row, e.g. the best quote.
 * @param {boolean} [props.last] Drops the bottom hairline.
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function TableRow({ children, highlighted = false, last = false, className }) {
  return (
    <tr
      className={cx(
        !last && 'border-b border-line',
        highlighted ? 'bg-teal-soft' : 'hover:bg-paper',
        className,
      )}
    >
      {children}
    </tr>
  );
}
