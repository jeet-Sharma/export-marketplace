import { PRODUCT_COLUMNS } from "./productColumns";
import { PRODUCT_ROWS } from "./productData";
import { ProductPagination } from "./ProductPagination";
import { ProductTableRow } from "./ProductTableRow";

const COLUMNS = [
  { label: "Product", width: PRODUCT_COLUMNS.product },
  { label: "Trade setup", width: PRODUCT_COLUMNS.trade },
  { label: "Price", width: PRODUCT_COLUMNS.price },
  { label: "Supplier", width: PRODUCT_COLUMNS.supplier },
  { label: "Status", width: PRODUCT_COLUMNS.status },
  { label: "Actions", width: PRODUCT_COLUMNS.actions },
];

export function ProductTable() {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-[14px] border border-bloom-border bg-white shadow-[0px_6px_20px_-4px_rgba(53,16,31,0.07)]">
      {/* Header */}
      <div className="flex h-[42px] w-full items-center gap-3 border-b border-bloom-border bg-[#f7f3f0] px-4 text-[10px] font-extrabold uppercase text-bloom-muted">
        {COLUMNS.map((col) => (
          <p key={col.label} className={col.width}>
            {col.label}
          </p>
        ))}
      </div>

      {/* Rows */}
      {PRODUCT_ROWS.map((product, i) => (
        <ProductTableRow
          key={product.id}
          product={product}
          highlighted={i === 0}
        />
      ))}

      <ProductPagination />
    </div>
  );
}
