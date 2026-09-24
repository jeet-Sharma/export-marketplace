// Every status key used anywhere in the vendor dashboard, grouped by the
// domain it belongs to. StatusPill/statusTokens (src/theme/colors.ts) map
// each of these to a Badge tone + label — this is the single source of
// truth for "what statuses exist", so adding a new status is a type-level
// change everywhere it's used, not a silent typo.
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type ProductStatus = "live" | "draft" | "review" | "pending" | "approved" | "rejected";

export type InventoryStatus = "inStock" | "low" | "outOfStock";

export type RfqStatus = "open" | "quoted" | "won" | "expired";

export type DocumentStatus = "verified" | "uploaded" | "missing";

/** Union of every status key StatusPill/statusTokens must be able to render. */
export type StatusKey =
  | OrderStatus
  | ProductStatus
  | InventoryStatus
  | RfqStatus
  | DocumentStatus;
