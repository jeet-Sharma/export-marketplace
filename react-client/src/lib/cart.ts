import type { CartItem, CartTotals } from "@/types/cart";
import { checkoutConfig } from "@/data/checkout";

// Client-safe cart math, kept as pure functions (like lib/formatters.ts)
// so CartPage/CheckoutSummary stay dumb about how totals are derived —
// swapping flat-rate shipping/tax for a real rates API later only means
// changing this file, not every caller.

export function getLineTotal(item: CartItem): number {
  return item.unitPrice * item.quantity;
}

export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + getLineTotal(item), 0);
}

/**
 * Flat-rate shipping/tax placeholder — the doc's "shipping cost
 * calculator" and "duties & taxes" need a real per-country rates source,
 * which doesn't exist yet (see lib/products.ts countryLogistics for the
 * per-product, per-country display-string version this would eventually
 * reconcile with). This keeps checkout's totals internally consistent
 * without inventing fake precision.
 */
export function getCartTotals(items: CartItem[]): CartTotals {
  const subtotal = getCartSubtotal(items);
  const shippingEstimate = items.length > 0 ? checkoutConfig.flatShippingEstimate : 0;
  const taxEstimate = Math.round(subtotal * checkoutConfig.taxRate);
  return {
    subtotal,
    shippingEstimate,
    taxEstimate,
    grandTotal: subtotal + shippingEstimate + taxEstimate,
  };
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Extracts a numeric price from a display-ready price string like
 * "$8.00/kg" or "$8/set" (see lib/products.ts PriceTier, types/public.ts
 * FeaturedProduct). This is the one place that price representation
 * boundary is crossed — every other price in the catalog stays a display
 * string; only the cart needs a real number to compute totals, and this
 * keeps that conversion in one auditable function instead of ad hoc
 * parsing wherever a product gets added to the cart.
 */
export function parsePriceToNumber(priceDisplay: string): number {
  const match = priceDisplay.match(/[\d.]+/);
  return match ? Number.parseFloat(match[0]) : 0;
}
