import type { CartItem, CartTotals } from "@/types/cart";
import { checkoutConfig } from "@/data/checkout";
import type { PriceTier } from "@/lib/products";
import type { BuyerOrder } from "@/types/order";

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

/**
 * Extracts the leading numeric quantity from a display string like
 * "100 kg" or "50 units" (see lib/products.ts Product.moq). Used as the
 * real minimum order quantity when adding a product to the cart, instead
 * of always adding a flat "1" regardless of what the product actually
 * requires.
 */
export function parseMoqToNumber(moqDisplay: string): number {
  const match = moqDisplay.match(/[\d.]+/);
  const parsed = match ? Number.parseFloat(match[0]) : 1;
  return parsed > 0 ? parsed : 1;
}

/**
 * Extracts the lower bound of a price tier's quantity range, e.g. "100"
 * from "100–500 kg" or "500" from "500+ kg" (see lib/products.ts
 * PriceTier.range). Used to pick which tier applies to a given quantity.
 */
function parseTierMinimum(range: string): number {
  const match = range.match(/[\d.]+/);
  return match ? Number.parseFloat(match[0]) : 0;
}

/**
 * Picks the price tier that applies to a given quantity — the highest
 * tier whose minimum the quantity meets or exceeds, falling back to the
 * first tier if the quantity is below every tier's minimum (shouldn't
 * happen once the MOQ floor is enforced, but keeps this function total).
 * Fixes AddToCartActions always using priceTiers[0] regardless of how
 * many units were actually added.
 */
export function getTierForQuantity(priceTiers: PriceTier[], quantity: number): PriceTier | undefined {
  if (priceTiers.length === 0) return undefined;

  const sorted = [...priceTiers].sort((a, b) => parseTierMinimum(a.range) - parseTierMinimum(b.range));
  const applicable = sorted.filter((tier) => quantity >= parseTierMinimum(tier.range));

  return applicable.length > 0 ? applicable[applicable.length - 1] : sorted[0];
}

/**
 * Converts the current cart into one BuyerOrder per line item — "Place
 * Order" used to only show a confirmation message without ever creating
 * an order a buyer could see again; this is what CartPage.tsx now calls
 * to actually record what was bought. One order per cart line (rather
 * than a single order spanning every product/supplier) because BuyerOrder
 * models a single product/supplier per row, matching how the existing
 * order book (data/buyerOrders.ts) already represents orders.
 */
export function cartItemsToOrders(items: CartItem[]): BuyerOrder[] {
  const placedDate = new Date().toISOString().slice(0, 10);

  return items.map((item) => ({
    id: `#B-${item.productId}-${Date.now()}`,
    product: item.name,
    supplier: item.supplierName,
    // Destination country isn't captured as a structured field at
    // checkout yet (only a free-text shipping address is) — see
    // CheckoutSummary.tsx. Left blank rather than guessed, to avoid
    // showing a country the buyer never actually confirmed.
    country: "",
    quantity: `${item.quantity} ${item.moq.replace(/^[\d.]+\s*/, "")}`.trim(),
    value: getLineTotal(item),
    incoterm: "FOB",
    placed: placedDate,
    status: "pending",
  }));
}
