const PAGES = ["1", "2", "3", "…", "38"];

export function ProductPagination() {
  return (
    <div className="flex h-[58px] w-full items-center justify-between bg-bloom-surface px-4">
      <p className="text-[12px] text-bloom-muted">
        Showing 1–5 of 186 products
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled
          className="flex h-8 items-center rounded-[6px] border border-bloom-border bg-white px-3 text-[11px] text-bloom-muted opacity-50"
        >
          ← Previous
        </button>
        {PAGES.map((page, i) => (
          <button
            key={`${page}-${i}`}
            type="button"
            className={
              i === 0
                ? "flex size-8 items-center justify-center rounded-[6px] border border-bloom-pink bg-bloom-pink text-[11px] font-bold text-white"
                : "flex size-8 items-center justify-center rounded-[6px] border border-bloom-border bg-white text-[11px] text-bloom-ink"
            }
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          className="flex h-8 items-center rounded-[6px] border border-bloom-pink bg-white px-3 text-[11px] font-bold text-bloom-pink"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
