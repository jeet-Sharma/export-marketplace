interface ProductsToolbarProps {
  resultCount: number;
  categoryResultCount: number;
  categoryName: string;
}

/** Result count and sort control row above the product grid. */
function ResultsSummary({
  resultCount,
  categoryResultCount,
  categoryName,
}: ProductsToolbarProps) {
  return (
    <div className="flex min-h-[42px] w-full flex-wrap items-center justify-between gap-3 text-[14px]">
      <p className="text-ink/50">
        <span className="font-bold text-ink">{resultCount} products</span>
        {` · ${categoryResultCount} in ${categoryName}`}
      </p>
      <button
        type="button"
        className="flex h-[42px] items-center gap-5 rounded-[10px] border border-black/[0.09] bg-white px-[14px] text-ink"
      >
        <span>
          <span className="text-ink/50">Sort by: </span>
          Recommended
        </span>
        <span aria-hidden>⌄</span>
      </button>
    </div>
  );
}

/** Removable chip row for currently active filters. */
function ActiveFilters() {
  return (
    <div className="flex w-full items-center gap-2 text-[13px]">
      <button
        type="button"
        className="flex items-center gap-[10px] rounded-full bg-pink/10 px-[11px] py-2 text-maroon"
      >
        Verified suppliers
        <span aria-hidden className="text-pink">
          ×
        </span>
      </button>
      <button type="button" className="text-pink hover:underline">
        Clear all
      </button>
    </div>
  );
}

/** Toolbar above the product grid: result counts, sort control and active filter chips. */
export function ProductsToolbar(props: ProductsToolbarProps) {
  return (
    <div className="flex w-full flex-col gap-[14px]">
      <ResultsSummary {...props} />
      <ActiveFilters />
    </div>
  );
}
