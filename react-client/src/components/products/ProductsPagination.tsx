import { Button } from "@/components/ui/Button";

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalResults: number;
  onPageChange: (page: number) => void;
  /** Disables page controls while a new page is being fetched. */
  isLoading?: boolean;
}

/** A single numbered page link/button. */
function PageLink({
  page,
  isActive,
  isLoading,
  onPageChange,
}: {
  page: number;
  isActive: boolean;
  isLoading: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <button
      type="button"
      aria-current={isActive ? "page" : undefined}
      disabled={isLoading}
      onClick={() => onPageChange(page)}
      className={`flex size-10 items-center justify-center rounded-[8px] border text-sm transition-colors duration-150 disabled:cursor-not-allowed ${
        isActive
          ? "border-pink bg-pink font-bold text-white"
          : "border-black/[0.09] bg-white text-ink hover:border-pink/40 hover:text-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-1"
      }`}
    >
      {page}
    </button>
  );
}

/**
 * Builds the visible page-number list: always the first and last page, the
 * current page and its immediate neighbors, with "…" gaps collapsed in
 * between. Keeps the control usable even when totalPages is large, instead
 * of rendering every page number.
 */
function getVisiblePages(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const result: Array<number | "ellipsis"> = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      result.push("ellipsis");
    }
    result.push(page);
  });
  return result;
}

/** Pagination control: result summary plus page links, matching the Figma design. */
export function ProductsPagination({
  currentPage,
  totalPages,
  pageSize,
  totalResults,
  onPageChange,
  isLoading = false,
}: ProductsPaginationProps) {
  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalResults);
  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="flex w-full flex-col items-center gap-4 pt-3">
      <p className="text-[13px] text-ink/50">
        Showing {rangeStart}–{rangeEnd} of {totalResults} products
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="secondary"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
          className="border-black/[0.09] text-ink/50 hover:border-black/[0.09] hover:bg-white hover:text-ink/50"
        >
          ← Previous
        </Button>

        {visiblePages.map((page, index) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="flex size-10 items-center justify-center rounded-[8px] border border-black/[0.09] bg-white text-sm text-ink"
            >
              …
            </span>
          ) : (
            <PageLink
              key={page}
              page={page}
              isActive={currentPage === page}
              isLoading={isLoading}
              onPageChange={onPageChange}
            />
          ),
        )}

        <Button
          variant="secondary"
          disabled={currentPage >= totalPages || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
