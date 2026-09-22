import Link from 'next/link';
import cx from '@/lib/cx';
import NavIcon from './NavIcon';

/**
 * @param {object} props
 * @param {string} props.href
 * @param {string} props.label
 * @param {import('./NavIcon').NavIconName} props.icon
 * @param {boolean} props.active
 * @param {number} [props.badgeCount] Shown when greater than zero.
 * @returns {import('react').ReactElement}
 */
export default function SidebarNavItem({ href, label, icon, active, badgeCount = 0 }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cx(
          'flex items-center gap-2.5 rounded-sharp border px-2.5 py-2 text-sm transition-colors',
          active
            ? 'border-line bg-paper font-medium text-text'
            : 'border-transparent text-textdim hover:bg-paper hover:text-text',
        )}
      >
        <span className={active ? 'text-saffron' : undefined}>
          <NavIcon name={icon} />
        </span>
        <span className="flex-1 truncate">{label}</span>
        {badgeCount > 0 && (
          <span className="rounded-sharp bg-saffron-soft px-1.5 font-heading text-[11px] leading-5 text-saffron">
            {badgeCount}
          </span>
        )}
      </Link>
    </li>
  );
}
