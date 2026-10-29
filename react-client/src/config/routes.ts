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
  /** `slug` must be the product's real API slug (ApiProductListItem.slug) — never a value re-derived from its display name. */
  product: (slug: string) => `/products/${slug}`,
  /** UI-only checkout page (no backend yet) reached from a product's "Buy now" action. */
  checkout: (slug: string) => `/checkout/${slug}`,
  /**
   * Category-filtered listing. Uses the existing `/products` page with a
   * `category` query param (no separate `/categories/[slug]` route exists
   * or is planned for Phase 1 — see marketplace listing requirements).
   * `slug` must be the category's real API slug (ApiCategory.slug).
   */
  category: (slug: string) => `/products?category=${encodeURIComponent(slug)}`,
  /**
   * No standalone category-browse page exists (or is in Phase 1 scope);
   * "view all categories" resolves to the unfiltered product listing,
   * which is the real, existing destination rather than a dead route.
   */
  categories: "/products",
  search: (query: string) => `/products?search=${encodeURIComponent(query)}`,
  newArrivals: "/products?sort=newest",

  // Account
  signIn: "/login",
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
  "Sell on Export Marketplace": routes.sellGlobally,
  Trade: routes.tradeAccount,
  Help: "/support",
  Terms: "/terms",
};
