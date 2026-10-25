/**
 * Shared column sizing for the product table header and rows.
 * Using flex-basis + grow (instead of fixed px) lets the row span the full
 * table width so there's no empty gutter on the right at wide viewports,
 * while min-widths keep columns readable when space is tight.
 */
export const PRODUCT_COLUMNS = {
  product: "w-[260px] shrink-0",
  trade: "min-w-[180px] flex-1",
  price: "min-w-[120px] flex-[0_0_15%]",
  supplier: "min-w-[150px] flex-1",
  status: "min-w-[130px] flex-1",
  actions: "w-[170px] shrink-0",
} as const;
