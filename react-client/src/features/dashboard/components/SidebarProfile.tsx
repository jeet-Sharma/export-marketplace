import type { DashboardProfile } from "../config/navConfig";
import { MoreHorizontalIcon } from "./icons";

type SidebarProfileProps = {
  profile: DashboardProfile;
};

export function SidebarProfile({ profile }: SidebarProfileProps) {
  return (
    <div className="flex w-full items-center gap-2 rounded-[14px] bg-white/5 p-3">
      <div className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-[#fbeaf0]">
        <span className="text-[12px] font-extrabold text-bloom-plum">
          {profile.initials}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-[12px] font-bold text-white">
          {profile.name}
        </p>
        <p className="truncate text-[10px] text-bloom-sidebar-muted">
          {profile.role}
        </p>
      </div>
      <button type="button" aria-label="Profile options" className="shrink-0">
        <MoreHorizontalIcon className="size-4 text-bloom-sidebar-muted" />
      </button>
    </div>
  );
}
