// Buyer cart seed data — used as the initial cart contents for a
// first-time visitor (nothing in localStorage yet). Unlike wishlist/
// product display prices (display strings like "$8/kg"), unitPrice here
// is a real number since checkout needs to compute totals — see
// lib/cart.ts's parsePriceToNumber for how a real "add to cart" action
// derives this from a product's display price.
import type { CartItem } from "@/types/cart";

const seedOnEmpty: CartItem[] = [
  {
    id: "cart-fp-1",
    productId: "fp-1",
    name: "Turmeric Powder",
    emoji: "\uD83C\uDF3F",
    supplierName: "ABC Exports",
    unitPrice: 8,
    quantity: 100,
    moq: "MOQ: 100 kg",
  },
  {
    id: "cart-fp-2",
    productId: "fp-2",
    name: "Cotton Bedsheet",
    emoji: "\uD83E\uDDF5",
    supplierName: "XYZ Traders",
    unitPrice: 8,
    quantity: 50,
    moq: "MOQ: 50 units",
  },
];

export interface CartMeta {
  panelTitle: string;
  emptyMessage: string;
  /** Starting cart contents shown before the buyer has added/removed
   * anything themselves — see lib/useCart.ts. */
  seedOnEmpty: CartItem[];
}

export const cartMeta: CartMeta = {
  panelTitle: "Shopping Cart",
  emptyMessage: "Your cart is empty. Browse the catalog to add products.",
  seedOnEmpty,
};
