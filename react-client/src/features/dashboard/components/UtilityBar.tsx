import { BellIcon } from "./icons";

type UtilityBarProps = {
  context: string;
  section: string;
};

export function UtilityBar({ context, section }: UtilityBarProps) {
  return (
    <div className="flex h-[58px] w-full shrink-0 items-center justify-between border-b border-[#eee9e4] bg-white px-6">
      <div className="flex items-center gap-2 text-[12px] whitespace-nowrap">
        <span className="font-bold text-bloom-ink">{context}</span>
        <span className="text-[#a6a2a4]">/</span>
        <span className="text-bloom-muted">{section}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full bg-bloom-green-surface px-3 py-2">
          <span className="size-[7px] rounded-full bg-bloom-green" />
          <span className="text-[11px] font-semibold text-bloom-green">
            Marketplace live
          </span>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          className="flex size-[34px] items-center justify-center rounded-[10px] border border-bloom-border bg-bloom-surface text-bloom-ink"
        >
          <BellIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
