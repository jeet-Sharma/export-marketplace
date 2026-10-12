import { ArrowDownUpIcon, SearchIcon } from "../components/icons";

export function ProductControls() {
  return (
    <div className="flex w-full flex-col gap-3 rounded-[14px] border border-[#eee9e4] bg-bloom-surface p-4 shadow-[0px_6px_20px_-4px_rgba(53,16,31,0.07)]">
      <div className="flex w-full items-center gap-2 rounded-[10px] border border-bloom-border bg-white px-3 h-10">
        <SearchIcon className="size-4 shrink-0 text-bloom-muted" />
        <input
          type="search"
          placeholder="Search product, SKU, supplier, HS code…"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-bloom-ink outline-none placeholder:text-[#a6a2a4]"
        />
        <span className="shrink-0 rounded-[4px] bg-[#f4f1ee] px-1.5 py-0.5 text-[10px] text-bloom-muted">
          &#8984; K
        </span>
      </div>
      <div className="flex w-full items-center justify-between">
        <p className="text-[12px] font-bold text-bloom-ink">186 products</p>
        <p className="text-[12px] text-bloom-muted">Updated recently</p>
        <ArrowDownUpIcon className="size-[14px] text-bloom-muted" />
      </div>
    </div>
  );
}
