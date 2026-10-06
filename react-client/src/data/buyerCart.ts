// Buyer cart copy/config. Cart *contents* are never seeded from static
// data — a first-time buyer's cart is genuinely empty (see
// lib/useCart.ts readCart()); this file only holds the panel title and
// empty-state message shown around whatever the buyer has actually added.
export interface CartMeta {
  panelTitle: string;
  emptyMessage: string;
}

export const cartMeta: CartMeta = {
  panelTitle: "Shopping Cart",
  emptyMessage: "Your cart is empty. Browse the catalog to add products.",
};
