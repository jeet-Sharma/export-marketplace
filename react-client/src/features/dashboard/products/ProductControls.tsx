"use client";

import { useEffect, useState } from "react";
import { ArrowDownUpIcon, SearchIcon } from "../components/icons";
import type { ProductSort } from "./productTypes";

import { useGetCategoriesQuery } from "@/features/categories/api/categories.queries";

type ProductControlsProps = {
  search: string;
  sort: ProductSort;
  status: "all" | "PUBLISHED" | "DRAFT";
  categoryId?: string;
  totalItems?: number;
  onSearchChange: (value: string) => void;
  onSortChange: (value: ProductSort) => void;
  onStatusChange: (status: "all" | "PUBLISHED" | "DRAFT") => void;
  onCategoryChange: (categoryId: string | null) => void;
};

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

const STATUS_TABS: { value: "all" | "PUBLISHED" | "DRAFT"; label: string }[] = [
  { value: "all", label: "All Status" },
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Drafts" },
];

function SearchBox({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const [text, setText] = useState(search);

  useEffect(() => {
    if (text === search) {
      return;
    }
    const handle = setTimeout(() => onSearchChange(text), 350);
    return () => clearTimeout(handle);
  }, [text, search, onSearchChange]);

  return (
    <div className="flex w-full items-center gap-2 rounded-[10px] border border-bloom-border bg-white px-3 h-10 focus-within:border-bloom-pink focus-within:ring-1 focus-within:ring-bloom-pink/20">
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
  status,
  categoryId,
  totalItems,
  onSearchChange,
  onSortChange,
  onStatusChange,
  onCategoryChange,
}: ProductControlsProps) {
  const { data: categories } = useGetCategoriesQuery();

  return (
    <div className="flex w-full flex-col gap-3 rounded-[14px] border border-[#eee9e4] bg-bloom-surface p-4 shadow-[0px_6px_20px_-4px_rgba(53,16,31,0.07)]">
      {/* Top row: search & category filter */}
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchBox
            key={search}
            search={search}
            onSearchChange={onSearchChange}
          />
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-2">
          <select
            value={categoryId ?? ""}
            onChange={(e) => onCategoryChange(e.target.value || null)}
            aria-label="Filter by category"
            className="h-10 cursor-pointer rounded-[10px] border border-bloom-border bg-white px-3 text-[13px] font-semibold text-bloom-ink outline-none transition-colors hover:border-bloom-pink/50"
          >
            <option value="">All Categories</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom row: status pills & sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#f0ece9]">
        {/* Status filter pills */}
        <div className="flex items-center gap-1.5">
          {STATUS_TABS.map((tab) => {
            const isSelected = status === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => onStatusChange(tab.value)}
                className={`rounded-[8px] px-3 py-1.5 text-[12px] font-bold transition-all ${
                  isSelected
                    ? "bg-bloom-pink text-white shadow-sm"
                    : "bg-white text-bloom-ink border border-bloom-border hover:bg-bloom-cream"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Total count & sort */}
        <div className="flex items-center gap-4">
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
              className="cursor-pointer rounded-[6px] border border-bloom-border bg-white px-2 py-1 text-[12px] font-semibold text-bloom-ink outline-none transition-colors hover:border-bloom-pink/50"
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
    </div>
  );
}
