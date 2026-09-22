import cx from '@/lib/cx';

/**
 * Inline SVG icon set. Icons inherit `currentColor` and are purely decorative
 * unless a `title` is supplied.
 *
 * @typedef {keyof typeof ICON_PATHS} NavIconName
 */
const ICON_PATHS = {
  dashboard: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z'],
  products: ['M21 8l-9-5-9 5 9 5 9-5z', 'M3 8v8l9 5 9-5V8'],
  wishlist: ['M12 20s-7-4.35-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 4.65-7 9-7 9z'],
  rfq: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5', 'M9 13h6', 'M9 17h4'],
  orders: [
    'M9 4h6v3H9z',
    'M7 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1',
    'M8 12h8',
    'M8 16h5',
  ],
  cart: ['M3 4h2l2.4 11h10.4L20 7H6', 'M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', 'M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
  profile: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c0-3.6 3.6-6 8-6s8 2.4 8 6'],
  check: ['M4 12l5 5L20 6'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z', 'M21 21l-4.3-4.3'],
  alert: ['M12 3l9 16H3l9-16z', 'M12 9v5', 'M12 17h.01'],
  download: ['M12 4v11', 'M7 12l5 5 5-5', 'M5 20h14'],
  truck: [
    'M3 6h11v9H3z',
    'M14 9h4l3 3v3h-7z',
    'M7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
    'M17 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  ],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  star: ['M12 4l2.5 5.2 5.5.8-4 3.9.9 5.6L12 17l-4.9 2.5.9-5.6-4-3.9 5.5-.8z'],
  spark: ['M12 4l1.8 4.7L18.5 10l-4.7 1.8L12 16l-1.8-4.2L5.5 10l4.7-1.3z'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l4 2'],
  arrowUp: ['M12 19V5', 'M6 11l6-6 6 6'],
  arrowRight: ['M5 12h14', 'M13 6l6 6-6 6'],
  mail: ['M3 6h18v12H3z', 'M3 7l9 6 9-6'],
  location: ['M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z', 'M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  card: ['M3 6h18v12H3z', 'M3 10h18'],
  bank: ['M4 10l8-5 8 5', 'M7 10v8', 'M17 10v8', 'M4 20h16'],
  shield: ['M12 3l7 3v6c0 4-3 7-7 8-4-1-7-4-7-8V6z'],
  document: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5'],
};

/**
 * @param {object} props
 * @param {NavIconName} props.name
 * @param {number} [props.size] Pixel size of the square icon box.
 * @param {boolean} [props.filled] Fills the shape, used for toggled hearts.
 * @param {string} [props.title] Turns the icon into a labelled graphic.
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function NavIcon({ name, size = 16, filled = false, title, className }) {
  const paths = ICON_PATHS[name];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cx('shrink-0', className)}
    >
      {title && <title>{title}</title>}
      {paths.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
