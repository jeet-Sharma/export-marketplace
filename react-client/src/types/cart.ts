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
   * converted to this when a product is added from the catalog. */
  unitPrice: number;
  quantity: number;
  moq: string;
}

/** Computed totals for the current cart, derived by lib/cart.ts. */
export interface CartTotals {
  subtotal: number;
  shippingEstimate: number;
  taxEstimate: number;
  grandTotal: number;
}
