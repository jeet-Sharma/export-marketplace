import type { ReactNode } from "react";
import type { DashboardRole } from "../config/navConfig";
import { ROLE_CONFIG } from "../config/navConfig";
import { Sidebar } from "./Sidebar";
import { UtilityBar } from "./UtilityBar";

type DashboardLayoutProps = {
  role: DashboardRole;
  /** key of the active nav item (matches a NavItem.key in the role config) */
  activeKey: string;
  /** breadcrumb section label shown after the workspace context */
  section: string;
  children: ReactNode;
};

export function DashboardLayout({
  role,
  activeKey,
  section,
  children,
}: DashboardLayoutProps) {
  const config = ROLE_CONFIG[role];

  return (
    <div className="flex min-h-full items-stretch bg-bloom-cream font-sans text-bloom-ink">
      <Sidebar config={config} activeKey={activeKey} />

      <div className="flex min-h-full min-w-0 flex-1 flex-col overflow-hidden bg-bloom-cream">
        {/* Brand accent */}
        <div className="h-1 w-full shrink-0 bg-bloom-pink" />
        <UtilityBar context={config.workspaceContext} section={section} />
        <div className="flex w-full flex-col gap-5 px-6 pb-8 pt-6">
          {children}
        </div>
      </div>
    </div>
  );
}
