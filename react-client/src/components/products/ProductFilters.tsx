import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { routes } from "@/config/routes";
import { useCountriesQuery } from "@/features/countries/api/countries.queries";
import type { CategoryChip } from "@/components/products/CategoryIntro";

interface FilterGroupProps {
  title: string;
  children: React.ReactNode;
}

/** A titled filter section with a top divider. */
function FilterGroup({ title, children }: FilterGroupProps) {
  return (
    <div className="flex w-full flex-col gap-[13px] border-t border-black/[0.09] py-[19px]">
      <p className="text-[14px] font-bold text-ink">{title}</p>
      {children}
    </div>
  );
}

/** Every category. The one in the URL is pink; choosing another filters the grid. */
function CategoryFilterGroup({
  categories,
  selectedSlug,
}: {
  categories: CategoryChip[];
  selectedSlug: string | null;
}) {
  return (
    <FilterGroup title="Category">
      <ul className="flex flex-col gap-2">
        {categories.map((category) => {
          const selected = category.slug === selectedSlug;
          return (
            <li key={category.id}>
              <Link
                href={routes.category(category.slug)}
                aria-current={selected ? "page" : undefined}
                className={`block rounded py-[2px] text-[14px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-1 ${selected ? "font-bold text-pink" : "text-ink hover:text-pink"}`}
              >
                {category.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </FilterGroup>
  );
}

interface MoqFilterGroupProps {
  minMoq?: number;
  maxMoq?: number;
  onApply: (minMoq?: number, maxMoq?: number) => void;
}

/** MOQ (minimum order quantity) range filter group — applies minMoq/maxMoq on submit. */
function MoqFilterGroup({ minMoq, maxMoq, onApply }: MoqFilterGroupProps) {
  const [minInput, setMinInput] = useState(minMoq?.toString() ?? "");
  const [maxInput, setMaxInput] = useState(maxMoq?.toString() ?? "");

  function handleApply() {
    const parsedMin = minInput.trim() === "" ? undefined : Number(minInput);
    const parsedMax = maxInput.trim() === "" ? undefined : Number(maxInput);
    onApply(
      Number.isFinite(parsedMin) ? parsedMin : undefined,
      Number.isFinite(parsedMax) ? parsedMax : undefined,
    );
  }

  return (
    <FilterGroup title="MOQ">
      <div className="flex w-full items-center gap-[10px] text-[14px]">
        <label className="flex flex-1 flex-col gap-1 rounded-[6px] border border-black/[0.09] bg-white p-[10px] transition-colors duration-150 focus-within:border-pink focus-within:ring-1 focus-within:ring-pink/30">
          <span className="text-[12px] text-ink/50">Min</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={minInput}
            onChange={(event) => setMinInput(event.target.value)}
            className="w-full bg-transparent text-ink focus:outline-none"
            placeholder="Any"
          />
        </label>
        <span className="text-ink/50">–</span>
        <label className="flex flex-1 flex-col gap-1 rounded-[6px] border border-black/[0.09] bg-white p-[10px] transition-colors duration-150 focus-within:border-pink focus-within:ring-1 focus-within:ring-pink/30">
          <span className="text-[12px] text-ink/50">Max</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={maxInput}
            onChange={(event) => setMaxInput(event.target.value)}
            className="w-full bg-transparent text-ink focus:outline-none"
            placeholder="Any"
          />
        </label>
      </div>
      <Button variant="secondary" className="h-[35px] w-full" onClick={handleApply}>
        Apply MOQ
      </Button>
    </FilterGroup>
  );
}

interface ShippingCountryFilterGroupProps {
  selectedIso2: string | undefined;
  onSelect: (iso2: string | undefined) => void;
}

/**
 * Shipping country filter group, populated from the live GET /countries
 * list. Single-select (checking a country unchecks any previous one) to
 * match the backend's single `sourceCountryId` filter param — there is no
 * multi-country filter on GET /products.
 */
function ShippingCountryFilterGroup({
  selectedIso2,
  onSelect,
}: ShippingCountryFilterGroupProps) {
  const { data: countries, isLoading, isError } = useCountriesQuery();

  return (
    <FilterGroup title="Shipping country">
      {isLoading ? (
        <p className="text-[12px] text-ink/50">Loading countries…</p>
      ) : isError || !countries?.length ? (
        <p className="text-[12px] text-ink/50">Countries unavailable.</p>
      ) : (
        countries.map((country) => (
          <Checkbox
            key={country.id}
            label={country.name}
            className="w-full"
            checked={selectedIso2 === country.iso2Code}
            onChange={() =>
              onSelect(selectedIso2 === country.iso2Code ? undefined : country.iso2Code)
            }
          />
        ))
      )}
    </FilterGroup>
  );
}

export interface ProductFiltersValue {
  minMoq?: number;
  maxMoq?: number;
  sourceCountryIso2?: string;
}

interface ProductFiltersProps {
  categories: CategoryChip[];
  selectedCategorySlug: string | null;
  value: ProductFiltersValue;
  onChange: (next: ProductFiltersValue) => void;
  onReset: () => void;
}

/** Sidebar filter panel for the product listing page — fully controlled by the URL state in ProductsPageContent. */
export function ProductFilters({
  categories,
  selectedCategorySlug,
  value,
  onChange,
  onReset,
}: ProductFiltersProps) {
  // Mobile: filters collapse into a toggle so users reach the product grid
  // without scrolling past the entire sidebar. Desktop: always expanded
  // (lg:flex always wins via Tailwind's responsive prefix).
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasActiveFilters = Boolean(
    value.minMoq !== undefined || value.maxMoq !== undefined || value.sourceCountryIso2,
  );

  return (
    <aside className="flex w-full shrink-0 flex-col lg:w-[228px]">
      <div className="flex h-[42px] w-full items-center justify-between">
        <h2 className="text-xl text-ink">Filters</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className={`text-[13px] transition-colors duration-150 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 rounded ${hasActiveFilters ? "text-pink hover:text-pink-hover" : "text-ink/40 cursor-default"}`}
            disabled={!hasActiveFilters}
            aria-disabled={!hasActiveFilters}
          >
            Reset all
          </button>
          {/* Mobile toggle — hidden on desktop */}
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="product-filters-panel"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-8 items-center gap-1.5 rounded-[8px] border border-black/[0.09] bg-white px-3 text-[13px] text-ink transition-colors duration-150 hover:border-pink/40 hover:text-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 lg:hidden"
          >
            <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden>
              <path d="M1 1h12M3 6h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {mobileOpen ? "Hide filters" : "Show filters"}
          </button>
        </div>
      </div>
      {/* Filter body — always visible on desktop; toggleable on mobile */}
      <div
        id="product-filters-panel"
        className={`${mobileOpen ? "flex" : "hidden"} flex-col lg:flex`}
      >
        <CategoryFilterGroup
          categories={categories}
          selectedSlug={selectedCategorySlug}
        />
        <MoqFilterGroup
          key={`${value.minMoq ?? ""}-${value.maxMoq ?? ""}`}
          minMoq={value.minMoq}
          maxMoq={value.maxMoq}
          onApply={(minMoq, maxMoq) => onChange({ ...value, minMoq, maxMoq })}
        />
        <ShippingCountryFilterGroup
          selectedIso2={value.sourceCountryIso2}
          onSelect={(sourceCountryIso2) => onChange({ ...value, sourceCountryIso2 })}
        />
      </div>
    </aside>
  );
}
