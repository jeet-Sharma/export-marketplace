'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { brand, navSections } from '@/data/seedData';
import { buyerProfile } from '@/data/profile';
import { statusLabel } from '@/lib/statusColor';
import useCart from '@/lib/useCart';
import LetterTile from './LetterTile';
import SidebarNavItem from './SidebarNavItem';

/**
 * True when the nav item owns the current route, including its detail pages.
 * @param {string} pathname
 * @param {string} href
 * @returns {boolean}
 */
function isActiveRoute(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Buyer navigation rail. Mounted once by `BuyerLayout`, so it keeps its state
 * across route changes.
 * @returns {import('react').ReactElement}
 */
export default function Sidebar() {
  const pathname = usePathname();
  const { lineCount, wishlistCount } = useCart();

  /** @type {Record<string, number>} */
  const badgeCounts = { cart: lineCount, wishlist: wishlistCount };

  return (
    <aside className="hidden w-[228px] shrink-0 border-r border-line bg-panel lg:flex lg:flex-col">
      <div className="border-b border-line px-4 py-4">
        <Link href="/" className="block">
          <span className="block font-heading text-base font-semibold tracking-tight text-ink">
            {brand.name}
          </span>
          <span className="mt-1 block font-heading text-[10px] font-semibold tracking-[0.14em] text-saffron">
            {brand.panelLabel}
          </span>
        </Link>
      </div>

      <nav aria-label="Buyer panel" className="flex-1 overflow-y-auto px-2.5 py-4">
        {navSections.map((section) => (
          <div key={section.id} className="mb-5 last:mb-0">
            <h2 className="px-2.5 pb-2 font-heading text-[10px] font-semibold uppercase tracking-[0.14em] text-textdim">
              {section.label}
            </h2>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarNavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={isActiveRoute(pathname, item.href)}
                  badgeCount={badgeCounts[item.icon] ?? 0}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-line px-4 py-3">
        <LetterTile
          label={buyerProfile.companyName}
          initials={buyerProfile.initials}
          accent="blueGrey"
        />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-text">{buyerProfile.companyName}</p>
          <p className="text-[11px] text-saffron">KYC {statusLabel(buyerProfile.kycStatus)}</p>
        </div>
      </div>
    </aside>
  );
}
