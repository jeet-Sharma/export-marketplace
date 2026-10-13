import type { GetProductsParams } from "@/features/products/types/product-api.types";

type SortValue = NonNullable<GetProductsParams["sort"]>;

const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

interface ProductsToolbarProps {
  resultCount: number;
  categoryName: string;
  sort: SortValue;
  onSortChange: (sort: SortValue) => void;
}

/** Result count and sort control row above the product grid. */
function ResultsSummary({
  resultCount,
  categoryName,
  sort,
  onSortChange,
}: ProductsToolbarProps) {
  return (
    <div className="flex min-h-[42px] w-full flex-wrap items-center justify-between gap-3 text-[14px]">
      <p className="text-ink/50">
        <span className="font-bold text-ink">{resultCount} products</span>
        {` in ${categoryName}`}
      </p>
      <label className="flex h-[42px] items-center gap-2 rounded-[10px] border border-black/[0.09] bg-white px-[14px] text-ink">
        <span className="text-ink/50">Sort by:</span>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortValue)}
          className="bg-transparent text-ink focus:outline-none"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** Toolbar above the product grid: result count and sort control, both URL-driven (see ProductsPageContent). */
export function ProductsToolbar(props: ProductsToolbarProps) {
  return (
    <div className="flex w-full flex-col gap-[14px]">
      <ResultsSummary {...props} />
    </div>
  );
}
