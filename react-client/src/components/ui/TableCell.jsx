import cx from '@/lib/cx';
import { CELL_ALIGNMENT } from './Table';

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {'left' | 'right' | 'center'} [props.align]
 * @param {boolean} [props.header] Renders a row header cell (`th scope="row"`).
 * @param {boolean} [props.numeric] Uses the heading font for figures and IDs.
 * @param {boolean} [props.dim]
 * @param {number} [props.colSpan]
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function TableCell({
  children,
  align = 'left',
  header = false,
  numeric = false,
  dim = false,
  colSpan,
  className,
}) {
  const classes = cx(
    'px-4 py-3 align-middle',
    CELL_ALIGNMENT[align],
    numeric && 'font-heading tabular-nums',
    dim ? 'text-textdim' : 'text-text',
    className,
  );

  if (header) {
    return (
      <th scope="row" colSpan={colSpan} className={cx(classes, 'font-medium')}>
        {children}
      </th>
    );
  }

  return (
    <td colSpan={colSpan} className={classes}>
      {children}
    </td>
  );
}
