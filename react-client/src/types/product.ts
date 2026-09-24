import type { ProductStatus } from "@/types/status";

/** One row in the vendor product catalog. */
export interface Product {
  id: string;
  name: string;
  origin: string;
  market: string;
  /** Single emoji used as a lightweight product thumbnail. */
  emoji: string;
  /** Display-ready price string, e.g. "$8/kg" — not a parsed number. */
  price: string;
  /** Minimum order quantity, e.g. "100 kg". */
  moq: string;
  hsCode: string;
  /** Human-readable workflow stage, e.g. "Checker review". */
  stage: string;
  status: ProductStatus;
  /** Label for the row's primary action button, e.g. "Edit" or "Revise". */
  action: string;
}
