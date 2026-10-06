// Checkout-related config values. Kept as data (not magic numbers inline
// in lib/cart.ts) so ops/business can tune the placeholder shipping/tax
// rate without touching cart math — same reasoning as sellWithUsMeta,
// ordersMeta etc keeping copy/config out of component code.
//
// These are flat-rate stand-ins for a real shipping-rates/tax API, which
// doesn't exist yet (see lib/products.ts countryLogistics for the
// per-product, per-country display-string version this would eventually
// reconcile with).
export interface CheckoutConfig {
  flatShippingEstimate: number;
  taxRate: number;
}

export const checkoutConfig: CheckoutConfig = {
  flatShippingEstimate: 45,
  taxRate: 0.02,
};
