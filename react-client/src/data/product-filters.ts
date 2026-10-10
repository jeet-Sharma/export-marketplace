import type { FilterOption } from "@/types/product-filters";

/** Subcategory filter options shown in the "Category" filter group. */
export const SUBCATEGORY_FILTERS: FilterOption[] = [
  { label: "Tableware & kitchen", count: 62 },
  { label: "Textiles", count: 48 },
  { label: "Decor & accessories", count: 35 },
  { label: "Lighting", count: 23 },
  { label: "Storage & baskets", count: 18 },
];

/** Shipping country filter options shown in the "Shipping country" group. */
export const SHIPPING_COUNTRY_FILTERS: FilterOption[] = [
  { label: "Netherlands", count: 186 },
  { label: "Germany", count: 142 },
  { label: "Belgium", count: 118 },
  { label: "United Kingdom", count: 96 },
  { label: "France", count: 84 },
];

/** Subcategory pills shown beneath the category heading. */
export const SUBCATEGORY_TABS: readonly string[] = [
  "All Home & Living",
  "Tableware & kitchen",
  "Textiles",
  "Decor & accessories",
  "Lighting",
  "Storage & baskets",
];
