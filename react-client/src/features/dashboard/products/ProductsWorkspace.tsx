import { PRODUCT_SUMMARIES } from "./productData";
import { ProductControls } from "./ProductControls";
import { ProductSummaryCard } from "./ProductSummaryCard";
import { ProductsHeading } from "./ProductsHeading";
import { ProductTable } from "./ProductTable";

export function ProductsWorkspace() {
  return (
    <>
      <ProductsHeading />

      <div className="flex w-full gap-3">
        {PRODUCT_SUMMARIES.map((summary) => (
          <ProductSummaryCard key={summary.key} summary={summary} />
        ))}
      </div>

      <ProductControls />
      <ProductTable />
    </>
  );
}
