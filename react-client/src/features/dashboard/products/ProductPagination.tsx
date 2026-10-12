"use client";

import type { PaginatedResponse } from "./productTypes";

type ProductPaginationProps = {
  pagination: PaginatedResponse<unknown>["pagination"];
  onPageChange: (page: number) => void;
};

/** Build a compact page list with ellipses, e.g. [1,2,3,"…",38]. */
function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export function ProductPagination({
  pagination,
  onPageChange,
}: ProductPaginationProps) {
  const { page, pageSize, totalItems, totalPages } = pagination;

  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const pages = buildPageList(page, totalPages);

  return (
    <div className="flex h-[58px] w-full items-center justify-between bg-bloom-surface px-4">
      <p className="text-[12px] text-bloom-muted">
        Showing {from}–{to} of {totalItems} products
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 items-center rounded-[6px] border border-bloom-border bg-white px-3 text-[11px] text-bloom-ink disabled:cursor-not-allowed disabled:text-bloom-muted disabled:opacity-50"
        >
          ← Previous
        </button>
        {pages.map((entry, i) =>
          entry === "…" ? (
            <span
              key={`gap-${i}`}
              className="flex size-8 items-center justify-center text-[11px] text-bloom-muted"
            >
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPageChange(entry)}
              aria-current={entry === page ? "page" : undefined}
              className={
                entry === page
                  ? "flex size-8 items-center justify-center rounded-[6px] border border-bloom-pink bg-bloom-pink text-[11px] font-bold text-white"
                  : "flex size-8 items-center justify-center rounded-[6px] border border-bloom-border bg-white text-[11px] text-bloom-ink hover:border-bloom-pink"
              }
            >
              {entry}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 items-center rounded-[6px] border border-bloom-pink bg-white px-3 text-[11px] font-bold text-bloom-pink disabled:cursor-not-allowed disabled:border-bloom-border disabled:text-bloom-muted disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
