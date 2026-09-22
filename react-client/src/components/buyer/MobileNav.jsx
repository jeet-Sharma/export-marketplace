'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { brand, navSections } from '@/data/seedData';
import cx from '@/lib/cx';
import NavIcon from './NavIcon';

const navItems = navSections.flatMap((section) => section.items);

/**
 * Navigation for viewports below `lg`, where the sidebar is hidden.
 * @returns {import('react').ReactElement}
 */
export default function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-line bg-panel lg:hidden">
      <div className="flex items-baseline gap-2 px-4 pt-3">
        <span className="font-heading text-sm font-semibold text-ink">{brand.name}</span>
        <span className="font-heading text-[10px] font-semibold tracking-[0.14em] text-saffron">
          {brand.panelLabel}
        </span>
      </div>

      <nav aria-label="Buyer panel" className="overflow-x-auto px-2 py-2">
        <ul className="flex items-center gap-1">
          {navItems.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'flex items-center gap-1.5 rounded-sharp border px-2.5 py-1.5 text-xs whitespace-nowrap',
                    active
                      ? 'border-line bg-paper font-medium text-text'
                      : 'border-transparent text-textdim',
                  )}
                >
                  <NavIcon name={item.icon} size={14} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
