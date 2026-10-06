// Buyer wishlist seed data — saved products for later purchase/comparison.
// price/moq stay display-ready strings, matching FeaturedProduct
// (types/public.ts) since neither has a parsed numeric price yet.
import type { WishlistItem } from "@/types/wishlist";

export const wishlistItems: WishlistItem[] = [
  {
    id: "wl-1",
    productId: "fp-1",
    name: "Turmeric Powder",
    emoji: "\uD83C\uDF3F",
    price: "$8.00/kg",
    moq: "MOQ: 100 kg",
    supplierName: "ABC Exports",
    supplierVerified: true,
    addedOn: "2026-09-12",
  },
  {
    id: "wl-2",
    productId: "fp-2",
    name: "Cotton Bedsheet",
    emoji: "\uD83E\uDDF5",
    price: "$8/set",
    moq: "MOQ: 50",
    supplierName: "XYZ Traders",
    supplierVerified: true,
    addedOn: "2026-09-08",
  },
  {
    id: "wl-3",
    productId: "fp-4",
    name: "Red Chilli Powder",
    emoji: "\uD83C\uDF36",
    price: "$6.50/kg",
    moq: "MOQ: 200 kg",
    supplierName: "ABC Exports",
    supplierVerified: true,
    addedOn: "2026-08-30",
  },
];

export interface WishlistMeta {
  panelTitle: string;
  emptyMessage: string;
}

export const wishlistMeta: WishlistMeta = {
  panelTitle: "My Wishlist",
  emptyMessage: "You haven't saved any products yet. Browse the catalog to add some.",
};
