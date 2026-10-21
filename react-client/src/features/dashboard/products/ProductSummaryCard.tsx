import {
  BadgeCheckIcon,
  FilePenLineIcon,
  PackageIcon,
} from "../components/icons";
import type { ProductSummary } from "./productData";

const ICONS = {
  package: PackageIcon,
  "badge-check": BadgeCheckIcon,
  "file-pen-line": FilePenLineIcon,
};

const NOTE_TONE = {
  pink: "text-bloom-pink",
  green: "text-bloom-green",
  muted: "text-bloom-muted",
};

export function ProductSummaryCard({
  summary,
  isActive = false,
  onClick,
}: {
  summary: ProductSummary;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const Icon = ICONS[summary.icon];

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`flex flex-1 items-center gap-3 rounded-[14px] border p-4 shadow-[0px_6px_20px_-4px_rgba(53,16,31,0.07)] transition-all ${
        onClick ? "cursor-pointer hover:border-bloom-pink/40 hover:shadow-md" : ""
      } ${
        isActive
          ? "border-bloom-pink bg-white ring-2 ring-bloom-pink/20"
          : "border-[#eee9e4] bg-bloom-surface"
      }`}
    >
      <div
        className={`flex size-[38px] shrink-0 items-center justify-center rounded-[10px] ${summary.iconSurface}`}
      >
        <Icon className="size-[18px] text-bloom-ink" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-[12px] font-medium text-bloom-muted">
          {summary.label}
        </p>
        <div className="flex items-baseline justify-between">
          <p className="text-[22px] font-semibold text-bloom-ink">
            {summary.value}
          </p>
          <p className={`text-[10px] font-semibold ${NOTE_TONE[summary.noteTone]}`}>
            {summary.note}
          </p>
        </div>
      </div>
    </div>
  );
}
