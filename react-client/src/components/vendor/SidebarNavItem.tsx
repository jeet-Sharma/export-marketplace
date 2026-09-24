import Link from "next/link";
import NavIcon from "@/components/vendor/NavIcon";
import type { NavItem } from "@/config/navigation";

export interface SidebarNavItemProps {
  item: NavItem;
  active?: boolean;
}

// One sidebar row. Active rows get a saffron left marker, a lifted
// background and heavier text; hover is a plain CSS :hover, no JS needed.
export default function SidebarNavItem({ item, active = false }: SidebarNavItemProps) {
  const stateClasses = active
    ? "bg-saffron-soft border-saffron text-ink font-semibold"
    : "border-transparent text-text font-normal hover:bg-paper hover:text-ink";

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 font-body no-underline border-l-[3px] px-[14px] py-[9px] pl-[11px] text-[13px] leading-[1.2] ${stateClasses}`}
    >
      <NavIcon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  );
}
