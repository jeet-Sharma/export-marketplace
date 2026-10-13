import Link from "next/link";
import type { DashboardRole, NavItem } from "../config/navConfig";

type SidebarNavItemProps = {
  item: NavItem;
  active?: boolean;
  /** Current role, appended as ?role= to real links so navigation keeps the
      vendor/buyer view instead of resetting to admin. */
  role?: DashboardRole;
};

export function SidebarNavItem({
  item,
  active = false,
  role,
}: SidebarNavItemProps) {
  const Icon = item.icon;

  // A real route starts with "/". Items whose href is a bare "#..." fragment
  // have no destination yet — render them as a disabled control rather than a
  // link that just changes the URL fragment to nowhere (non-deceptive).
  const isRealRoute = item.href.startsWith("/");
  const href =
    isRealRoute && role ? `${item.href}?role=${role}` : item.href;

  const baseClasses =
    "flex h-[42px] w-full items-center gap-3 rounded-[10px] border-l-[3px] px-3 text-[13px]";
  const activeClasses =
    "border-bloom-pink bg-bloom-sidebar-active font-bold text-white";
  const idleClasses =
    "border-transparent font-medium text-bloom-sidebar-text transition-colors hover:bg-white/5";

  if (!isRealRoute) {
    return (
      <span
        aria-disabled="true"
        title="Coming soon"
        className={`${baseClasses} border-transparent cursor-not-allowed font-medium text-bloom-sidebar-muted opacity-70`}
      >
        <Icon className="size-[17px] shrink-0" />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${baseClasses} ${active ? activeClasses : idleClasses}`}
    >
      <Icon className="size-[17px] shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </Link>
  );
}
