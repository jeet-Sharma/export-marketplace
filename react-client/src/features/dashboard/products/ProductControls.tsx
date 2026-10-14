"use client";

import { useEffect, useState } from "react";
import { ArrowDownUpIcon, SearchIcon } from "../components/icons";
import type { ProductSort } from "./productTypes";

type ProductControlsProps = {
  search: string;
  sort: ProductSort;
  totalItems?: number;
  onSearchChange: (value: string) => void;
  onSortChange: (value: ProductSort) => void;
};

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

function SearchBox({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  // Local text so typing is instant; the URL/query only updates after a short
  // pause (debounce). This component is keyed on the committed `search` by its
  // parent, so a back/forward navigation remounts it with the right initial
  // value instead of needing an in-render sync effect.
  const [text, setText] = useState(search);

  useEffect(() => {
    if (text === search) {
      return;
    }
    const handle = setTimeout(() => onSearchChange(text), 350);
    return () => clearTimeout(handle);
  }, [text, search, onSearchChange]);

  return (
    <div className="flex w-full items-center gap-2 rounded-[10px] border border-bloom-border bg-white px-3 h-10">
      <SearchIcon className="size-4 shrink-0 text-bloom-muted" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search products by name…"
        aria-label="Search products by name"
        className="min-w-0 flex-1 bg-transparent text-[13px] text-bloom-ink outline-none placeholder:text-[#a6a2a4]"
      />
    </div>
  );
}

export function ProductControls({
  search,
  sort,
  totalItems,
  onSearchChange,
  onSortChange,
}: ProductControlsProps) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-[14px] border border-[#eee9e4] bg-bloom-surface p-4 shadow-[0px_6px_20px_-4px_rgba(53,16,31,0.07)]">
      <SearchBox key={search} search={search} onSearchChange={onSearchChange} />
      <div className="flex w-full items-center justify-between">
        <p className="text-[12px] font-bold text-bloom-ink">
          {totalItems === undefined
            ? "Loading…"
            : `${totalItems} ${totalItems === 1 ? "product" : "products"}`}
        </p>
        <label className="flex items-center gap-2 text-[12px] text-bloom-muted">
          <ArrowDownUpIcon className="size-[14px]" />
          <span className="sr-only">Sort products</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as ProductSort)}
            className="cursor-pointer rounded-[6px] border border-bloom-border bg-white px-2 py-1 text-[12px] font-semibold text-bloom-ink outline-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
