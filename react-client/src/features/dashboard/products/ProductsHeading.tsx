import { DownloadIcon, PlusIcon } from "../components/icons";

export function ProductsHeading() {
  return (
    <div className="flex w-full items-end justify-between">
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-extrabold uppercase text-bloom-pink">
          Catalog operations
        </p>
        <h1 className="text-[30px] font-semibold text-bloom-ink">Products</h1>
        <p className="text-[13px] text-bloom-muted">
          Review listings, trade readiness, supplier verification, and
          publication status.
        </p>
      </div>
      <div className="flex shrink-0 items-start gap-2">
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[10px] border border-bloom-border bg-white px-4 text-[13px] font-semibold text-bloom-ink transition-colors hover:bg-bloom-cream"
        >
          <DownloadIcon className="size-[15px]" />
          Export CSV
        </button>
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-[10px] bg-bloom-pink px-4 text-[13px] font-bold text-white shadow-[0px_6px_20px_-4px_rgba(53,16,31,0.07)] transition-colors hover:bg-[#c2365f]"
        >
          <PlusIcon className="size-4" />
          Add product
        </button>
      </div>
    </div>
  );
}
