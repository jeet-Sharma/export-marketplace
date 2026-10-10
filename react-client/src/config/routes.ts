/**
 * Central route path constants for the public marketplace.
 *
 * Why this file exists: components must not scatter hardcoded path literals
 * (and must never use `href="#"` placeholders, which navigate nowhere). Every
 * link target is declared here once, so when a route segment is actually built
 * under `src/app`, only this file changes — callers stay untouched.
 *
 * NOTE: Most of these segments are not implemented as pages yet (only `/`
 * exists). They are the intended canonical destinations; linking to them now
 * gives real, shareable URLs instead of dead `#` anchors, and Next.js will
 * render its 404 for any not-yet-built page rather than silently doing nothing.
 */
export const routes = {
  home: "/",

  // Catalogue
  products: "/products",
  product: (name: string) => `/products/${toCategorySlug(name)}`,
  categories: "/categories",
  category: (slug: string) => `/categories/${slug}`,
  search: (query: string) => `/products?search=${encodeURIComponent(query)}`,
  requestQuote: (productName: string) =>
    `/products/${toCategorySlug(productName)}/rfq`,

  // Account
  signIn: "/sign-in",
  orders: "/orders",
  cart: "/cart",

  // Trade / export
  tradeAccount: "/trade-account",
  exportServices: "/export-services",
  sellGlobally: "/sell-with-us",
} as const;

/** Converts a display label (e.g. "Home & living") into a URL slug. */
export function toCategorySlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Footer link label -> destination, keyed by the labels in
 * `src/data/navigation.ts` FOOTER_LINKS. Centralized so the footer carries no
 * `#` placeholders. Unknown labels fall back to home at the call site.
 */
export const footerRoutes: Record<string, string> = {
  About: "/about",
  "Sell on Looma": routes.sellGlobally,
  Trade: routes.tradeAccount,
  Help: "/support",
  Terms: "/terms",
};
