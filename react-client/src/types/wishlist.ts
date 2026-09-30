/** One saved product in the buyer's wishlist. */
export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  emoji: string;
  /** Display-ready price string, matching FeaturedProduct/Product elsewhere
   * (see types/public.ts) — no parsed numeric price exists yet. */
  price: string;
  moq: string;
  supplierName: string;
  supplierVerified: boolean;
  addedOn: string;
}
