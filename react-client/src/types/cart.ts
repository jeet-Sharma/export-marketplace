import type { PriceTier } from "@/lib/products";

// Cart/checkout shapes for the buyer portal.

/** One line item in the buyer's cart. */
export interface CartItem {
  id: string;
  productId: string;
  name: string;
  emoji: string;
  supplierName: string;
  /** Unit price in USD, numeric — unlike the display-string prices used on
   * public product cards, the cart needs a real number to compute totals.
   * See lib/cart.ts parsePriceToNumber for how a display price is
   * converted to this when a product is added from the catalog. Kept in
   * sync with `quantity` by lib/useCart.ts's updateQuantity, which
   * re-derives it from `priceTiers` on every change instead of leaving
   * it fixed at whatever tier applied when the item was first added. */
  unitPrice: number;
  quantity: number;
  moq: string;
  /** The product's bulk-pricing tiers, carried on the cart line so
   * quantity changes (e.g. raising 100kg to 500kg) can re-price against
   * the correct tier without needing to look the product back up. */
  priceTiers: PriceTier[];
}

/** Computed totals for the current cart, derived by lib/cart.ts. */
export interface CartTotals {
  subtotal: number;
  shippingEstimate: number;
  taxEstimate: number;
  grandTotal: number;
}
