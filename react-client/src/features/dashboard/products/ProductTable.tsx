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

        {/* Body states */}
        {isError ? (
          <StateMessage
            title="Couldn't load products"
            detail="The request to the catalog service failed. Check that you're signed in and the API is reachable, then try again."
            action={
              <button
                type="button"
                onClick={onRetry}
                className="mt-1 rounded-[8px] border border-bloom-pink bg-white px-3 py-1.5 text-[12px] font-bold text-bloom-pink"
              >
                Retry
              </button>
            }
          />
        ) : isLoading ? (
          <StateMessage
            title="Loading products…"
            detail="Fetching the latest catalog from the server."
          />
        ) : rows.length === 0 ? (
          <StateMessage
            title="No products found"
            detail="No products match the current search or filters. Try a different search term."
          />
        ) : (
          <div
            className={isFetching ? "opacity-60 transition-opacity" : undefined}
          >
            {rows.map((product, i) => (
              <ProductTableRow
                key={product.id}
                product={product}
                detailHref={buildDetailHref(product.id)}
                highlighted={i === 0}
              />
            ))}
          </div>
        )}

        {pagination && rows.length > 0 && !isError ? (
          <ProductPagination
            pagination={pagination}
            onPageChange={onPageChange}
          />
        ) : null}
      </div>
    </div>
  );
}
