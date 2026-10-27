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
      <label className="flex h-[42px] cursor-pointer items-center gap-2 rounded-[10px] border border-black/[0.09] bg-white px-[14px] text-ink transition-all duration-150 hover:border-pink/40 hover:shadow-[0px_2px_8px_-2px_rgba(217,66,114,0.15)] focus-within:border-pink focus-within:ring-1 focus-within:ring-pink/30">
        <span className="text-ink/50">Sort by:</span>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortValue)}
          className="cursor-pointer appearance-none bg-transparent pr-4 text-ink transition-colors duration-150 focus:outline-none"
          aria-label="Sort products"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom dropdown arrow */}
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          aria-hidden
          className="pointer-events-none shrink-0 text-ink/40"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
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
