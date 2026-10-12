import Link from "next/link";
import type { NavItem } from "../config/navConfig";

type SidebarNavItemProps = {
  item: NavItem;
  active?: boolean;
};

export function SidebarNavItem({ item, active = false }: SidebarNavItemProps) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "flex h-[42px] w-full items-center gap-3 rounded-[10px] border-l-[3px] border-bloom-pink bg-bloom-sidebar-active px-3 text-[13px] font-bold text-white"
          : "flex h-[42px] w-full items-center gap-3 rounded-[10px] border-l-[3px] border-transparent px-3 text-[13px] font-medium text-bloom-sidebar-text transition-colors hover:bg-white/5"
      }
    >
      <Icon className="size-[17px] shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </Link>
  );
}
