import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { useCountriesQuery } from "@/features/countries/api/countries.queries";

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

/**
 * Category filter group. Shows only the active category — the backend's
 * category model has no subcategory hierarchy yet, so there is no real
 * data for a subcategory checkbox list (see CategoryIntro's CategoryTab
 * for the same constraint on the tabs above the grid).
 */
function CategoryFilterGroup({ categoryName }: { categoryName: string }) {
  return (
    <FilterGroup title="Category">
      <p className="text-[14px] font-bold text-pink">{categoryName}</p>
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
        <label className="flex flex-1 flex-col gap-1 rounded-[6px] border border-black/[0.09] bg-white p-[10px]">
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
        <label className="flex flex-1 flex-col gap-1 rounded-[6px] border border-black/[0.09] bg-white p-[10px]">
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
  categoryName: string;
  value: ProductFiltersValue;
  onChange: (next: ProductFiltersValue) => void;
  onReset: () => void;
}

/** Sidebar filter panel for the product listing page — fully controlled by the URL state in ProductsPageContent. */
export function ProductFilters({
  categoryName,
  value,
  onChange,
  onReset,
}: ProductFiltersProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col lg:w-[228px]">
      <div className="flex h-[42px] w-full items-center justify-between">
        <h2 className="text-xl text-ink">Filters</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-[13px] text-pink hover:underline"
        >
          Reset all
        </button>
      </div>
      <CategoryFilterGroup categoryName={categoryName} />
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
    </aside>
  );
}
