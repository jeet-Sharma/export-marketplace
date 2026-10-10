interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalResults: number;
}

/** A single numbered page link/button. */
function PageLink({ page, isActive }: { page: number; isActive: boolean }) {
  return (
    <button
      type="button"
      aria-current={isActive ? "page" : undefined}
      className={`flex size-10 items-center justify-center rounded-[8px] border text-sm transition-colors ${
        isActive
          ? "border-pink bg-pink font-bold text-white"
          : "border-black/[0.09] bg-white text-ink hover:border-pink/40"
      }`}
    >
      {page}
    </button>
  );
}

/** Pagination control: result summary plus page links, matching the Figma design. */
export function ProductsPagination({
  currentPage,
  totalPages,
  pageSize,
  totalResults,
}: ProductsPaginationProps) {
  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalResults);

  return (
    <div className="flex w-full flex-col items-center gap-4 pt-3">
      <p className="text-[13px] text-ink/50">
        Showing {rangeStart}–{rangeEnd} of {totalResults} products
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          className="flex h-10 items-center rounded-[8px] border border-black/[0.09] bg-white px-[14px] text-[13px] text-ink/50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        <PageLink page={1} isActive={currentPage === 1} />
        <PageLink page={2} isActive={currentPage === 2} />
        <PageLink page={3} isActive={currentPage === 3} />
        <PageLink page={4} isActive={currentPage === 4} />
        <span className="flex size-10 items-center justify-center rounded-[8px] border border-black/[0.09] bg-white text-sm text-ink">
          …
        </span>
        <PageLink page={totalPages} isActive={currentPage === totalPages} />

        <button
          type="button"
          disabled={currentPage >= totalPages}
          className="flex h-10 items-center rounded-[8px] border border-pink bg-white px-[14px] text-[13px] font-bold text-pink disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
