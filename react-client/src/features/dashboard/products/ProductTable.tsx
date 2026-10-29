"use client";

import { useRouter } from "next/navigation";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useAppDispatch } from "@/store/hooks";
import { clearCredentials } from "@/features/auth/authSlice";
import { baseApi } from "@/store/baseApi";
import { PRODUCT_COLUMNS } from "./productColumns";
import type { ProductRow } from "./productData";
import type { PaginatedResponse } from "./productTypes";
import { ProductPagination } from "./ProductPagination";
import { ProductTableRow } from "./ProductTableRow";

type ProductTableProps = {
  rows: ProductRow[];
  buildDetailHref: (id: string) => string;
  pagination?: PaginatedResponse<unknown>["pagination"];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
};

const COLUMNS = [
  { label: "Product", width: PRODUCT_COLUMNS.product },
  { label: "Trade setup", width: PRODUCT_COLUMNS.trade },
  { label: "Price", width: PRODUCT_COLUMNS.price },
  { label: "Supplier", width: PRODUCT_COLUMNS.supplier },
  { label: "Status", width: PRODUCT_COLUMNS.status },
  { label: "Actions", width: PRODUCT_COLUMNS.actions },
];

function StateMessage({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[220px] w-full flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <p className="text-[14px] font-semibold text-bloom-ink">{title}</p>
      <p className="max-w-[360px] text-[12px] text-bloom-muted">{detail}</p>
      {action}
    </div>
  );
}

export function ProductTable({
  rows,
  buildDetailHref,
  pagination,
  isLoading,
  isFetching,
  isError,
  onRetry,
  onPageChange,
}: ProductTableProps) {
  const hasRows = rows.length > 0;
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLoginAgain = () => {
    dispatch(clearCredentials());
    dispatch(baseApi.util.resetApiState());
    router.push("/login?force=true");
  };

  return (
    <div className="w-full overflow-x-auto rounded-[14px] border border-bloom-border bg-white shadow-[0px_6px_20px_-4px_rgba(53,16,31,0.07)]">
      {/* min-width keeps columns from crushing; the wrapper scrolls instead of
          clipping on narrow (laptop) viewports — fixes the cut-off Actions column. */}
      <div className="flex min-w-[1040px] flex-col">
        {/* Header */}
        <div className="flex h-[42px] w-full items-center gap-3 border-b border-bloom-border bg-[#f7f3f0] px-4 text-[10px] font-extrabold uppercase text-bloom-muted">
          {COLUMNS.map((col) => (
            <p key={col.label} className={col.width}>
              {col.label}
            </p>
          ))}
        </div>

        {/* Transient error banner when we still have cached rows */}
        {isError && hasRows ? (
          <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-2 text-[12px] text-amber-900">
            <span>Unable to refresh products right now. Showing previous catalog.</span>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-[6px] border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Body states */}
        {isLoading && !hasRows ? (
          <StateMessage
            title="Loading products…"
            detail="Fetching the latest catalog from the server."
          />
        ) : isError && !hasRows ? (
          <StateMessage
            title="Unable to load products"
            detail="Could not reach the server or verify your session. Please check your connection or retry."
            action={
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-[8px] border border-bloom-border bg-white px-3 py-1.5 text-[12px] font-bold text-bloom-ink hover:bg-bloom-cream"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={handleLoginAgain}
                  className="rounded-[8px] bg-bloom-pink px-4 py-1.5 text-[12px] font-bold text-white hover:opacity-90"
                >
                  Log in again
                </button>
              </div>
            }
          />
        ) : !hasRows ? (
          <StateMessage
            title="No products found"
            detail="No products match the current search or filters. Try a different search term or clear the filter."
          />
        ) : (
          <ErrorBoundary
            fallback={
              <StateMessage
                title="Table render issue"
                detail="There was a temporary problem displaying the products. Click Retry below."
                action={
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-2 rounded-[8px] border border-bloom-border bg-white px-3 py-1.5 text-[12px] font-bold text-bloom-ink hover:bg-bloom-cream"
                  >
                    Retry
                  </button>
                }
              />
            }
          >
            <div
              className={isFetching ? "opacity-60 transition-opacity" : undefined}
            >
              {rows.map((product, i) => (
                <ErrorBoundary key={product.id}>
                  <ProductTableRow
                    product={product}
                    detailHref={buildDetailHref(product.id)}
                    highlighted={i === 0}
                  />
                </ErrorBoundary>
              ))}
            </div>
          </ErrorBoundary>
        )}

        {pagination && hasRows ? (
          <ProductPagination
            pagination={pagination}
            onPageChange={onPageChange}
          />
        ) : null}
      </div>
    </div>
  );
}
