import { ChevronsUpDownIcon } from "./icons";

type SidebarBrandProps = {
  workspaceLabel: string;
};

export function SidebarBrand({ workspaceLabel }: SidebarBrandProps) {
  return (
    <div className="flex w-full flex-col gap-3 px-2 pb-6">
      <div className="flex w-full items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-[10px] bg-bloom-amber">
          <span className="text-[19px] font-bold leading-none text-bloom-ink">
            &#8734;
          </span>
        </div>
        <span className="text-[24px] text-white">looma</span>
      </div>
      <button
        type="button"
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="flex-1 text-[11px] font-extrabold uppercase text-bloom-sidebar-muted">
          {workspaceLabel}
        </span>
        <ChevronsUpDownIcon className="size-[13px] text-bloom-sidebar-muted" />
      </button>
    </div>
  );
}
