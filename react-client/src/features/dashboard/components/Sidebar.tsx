import type { DashboardRole, NavSection, RoleConfig } from "../config/navConfig";
import { SidebarBrand } from "./SidebarBrand";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarProfile } from "./SidebarProfile";

type SidebarProps = {
  config: RoleConfig;
  /** key of the currently active nav item */
  activeKey: string;
  /** active role, so nav links can preserve ?role= */
  role: DashboardRole;
};

function NavGroup({
  section,
  activeKey,
  role,
}: {
  section: NavSection;
  activeKey: string;
  role: DashboardRole;
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <p className="w-full text-[10px] font-extrabold uppercase text-bloom-sidebar-muted">
        {section.heading}
      </p>
      <div className="flex w-full flex-col gap-1 pt-2">
        {section.items.map((item) => (
          <SidebarNavItem
            key={item.key}
            item={item}
            active={item.key === activeKey}
            role={role}
          />
        ))}
      </div>
    </div>
  );
}

export function Sidebar({ config, activeKey, role }: SidebarProps) {
  return (
    <aside className="relative flex min-h-full w-[252px] shrink-0 flex-col overflow-hidden bg-bloom-sidebar px-4 pb-[18px] pt-[22px]">
      {/* Botanical glow */}
      <div
        className="pointer-events-none absolute -top-[70px] left-[150px] size-[190px] rounded-full bg-bloom-pink/20 blur-3xl"
        aria-hidden
      />

      <div className="relative flex min-h-full flex-col">
        <SidebarBrand workspaceLabel={config.workspaceLabel} />

        <NavGroup
          section={config.primaryNav}
          activeKey={activeKey}
          role={role}
        />

        <div className="my-5 h-px w-full bg-white/[0.09]" />

        <NavGroup
          section={config.secondaryNav}
          activeKey={activeKey}
          role={role}
        />

        <div className="min-h-[80px] flex-1" />

        <SidebarProfile profile={config.profile} />
      </div>
    </aside>
  );
}
