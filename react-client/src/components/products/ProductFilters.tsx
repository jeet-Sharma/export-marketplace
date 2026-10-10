import type { FilterOption } from "@/types/product-filters";
import { SHIPPING_COUNTRY_FILTERS, SUBCATEGORY_FILTERS } from "@/data/product-filters";

/** A single checkbox row with a result count, shared by every filter group. */
function FilterCheckbox({ option }: { option: FilterOption }) {
  return (
    <label className="flex w-full items-center gap-[9px] text-[14px] text-ink">
      <input
        type="checkbox"
        className="size-4 rounded-[3px] border border-black/20 accent-pink"
      />
      <span className="flex-1 leading-[1.4]">{option.label}</span>
      <span className="text-[12px] text-ink/50">{option.count}</span>
    </label>
  );
}

interface FilterGroupProps {
  title: string;
  children: React.ReactNode;
}

/** A titled, collapsible-looking filter section with a top divider. */
function FilterGroup({ title, children }: FilterGroupProps) {
  return (
    <div className="flex w-full flex-col gap-[13px] border-t border-black/[0.09] py-[19px]">
      <div className="flex w-full items-start justify-between text-[14px]">
        <p className="font-bold text-ink">{title}</p>
        <span aria-hidden className="text-ink/50">
          ⌃
        </span>
      </div>
      {children}
    </div>
  );
}

/** Category filter group: active category plus its subcategory checkboxes. */
function CategoryFilterGroup({ categoryName }: { categoryName: string }) {
  return (
    <FilterGroup title="Category">
      <p className="text-[14px] font-bold text-pink">{categoryName}</p>
      {SUBCATEGORY_FILTERS.map((option) => (
        <FilterCheckbox key={option.label} option={option} />
      ))}
    </FilterGroup>
  );
}

/** MOQ (minimum order quantity) range filter group. */
function MoqFilterGroup() {
  return (
    <FilterGroup title="MOQ">
      <div className="flex w-full items-center gap-[10px] text-[14px]">
        <div className="flex flex-1 flex-col gap-1 rounded-[6px] border border-black/[0.09] bg-white p-[10px]">
          <span className="text-[12px] text-ink/50">Min</span>
          <span className="text-ink">1 unit</span>
        </div>
        <span className="text-ink/50">–</span>
        <div className="flex flex-1 flex-col gap-1 rounded-[6px] border border-black/[0.09] bg-white p-[10px]">
          <span className="text-[12px] text-ink/50">Max</span>
          <span className="text-ink">24 units</span>
        </div>
      </div>
      <button
        type="button"
        className="flex h-[35px] w-full items-center justify-center rounded-[6px] border border-pink text-[13px] font-bold text-pink transition-colors hover:bg-pink/5"
      >
        Apply MOQ
      </button>
    </FilterGroup>
  );
}

/** Shipping country checkbox filter group. */
function ShippingCountryFilterGroup() {
  return (
    <FilterGroup title="Shipping country">
      {SHIPPING_COUNTRY_FILTERS.map((option) => (
        <FilterCheckbox key={option.label} option={option} />
      ))}
    </FilterGroup>
  );
}

/** Single "verified suppliers only" toggle, checked by default to match Figma. */
function VerifiedOnlyFilterGroup() {
  return (
    <FilterGroup title="Verified only">
      <label className="flex w-full items-center gap-[9px] text-[14px] text-ink">
        <input
          type="checkbox"
          defaultChecked
          className="size-4 rounded-[3px] border border-pink bg-pink accent-pink"
        />
        <span className="flex-1 leading-[1.4]">Verified suppliers only</span>
      </label>
    </FilterGroup>
  );
}

interface ProductFiltersProps {
  categoryName: string;
}

/** Sidebar filter panel for the product listing page. */
export function ProductFilters({ categoryName }: ProductFiltersProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col lg:w-[228px]">
      <div className="flex h-[42px] w-full items-center justify-between">
        <h2 className="text-xl text-ink">Filters</h2>
        <button type="button" className="text-[13px] text-pink hover:underline">
          Reset all
        </button>
      </div>
      <CategoryFilterGroup categoryName={categoryName} />
      <MoqFilterGroup />
      <ShippingCountryFilterGroup />
      <VerifiedOnlyFilterGroup />
    </aside>
  );
}
