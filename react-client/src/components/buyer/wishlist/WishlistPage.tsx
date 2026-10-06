"use client";

import PageHeader from "@/components/vendor/PageHeader";
import WishlistGrid from "@/components/buyer/wishlist/WishlistGrid";
import { wishlistMeta } from "@/data/buyerWishlist";
import { buyerProfileSummary } from "@/data/buyerSeedData";
import { getProductById } from "@/lib/products";
import { useCart } from "@/lib/useCart";
import { useWishlist } from "@/lib/useWishlist";
import type { WishlistItem } from "@/types/wishlist";

// Buyer wishlist — no vendor-side equivalent, so this follows the buyer
// portal's general page shape (PageHeader + main content column) rather
// than mirroring a specific vendor page.
//
// Wishlist state comes from useWishlist() (localStorage-backed) instead
// of local useState seeded from static data — plain useState re-runs its
// initializer from the seed every time this page remounts (leaving and
// coming back, or a refresh), so a removed item would just reappear.
export default function WishlistPage() {
  const { items, removeItem } = useWishlist();
  const { addItem } = useCart();

  function handleRemove(item: WishlistItem) {
    removeItem(item.id);
  }

  // useCart().addItem needs the full catalog Product (price tiers,
  // supplier, real MOQ) — a WishlistItem only carries the lighter
  // display fields shown on the card, so look the full record up by id
  // instead of trying to build a Product out of what's on the wishlist
  // entry itself. See lib/products.ts getProductById.
  function handleAddToCart(item: WishlistItem) {
    const product = getProductById(item.productId);
    if (!product) return;
    addItem(product);
  }

  return (
    <>
      <PageHeader
        title="Wishlist"
        breadcrumb="Buyer Panel / Saved Products"
        verified={buyerProfileSummary.verified}
        verifiedLabel="Verified Buyer"
      />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4">
          <h2 className="font-heading font-semibold text-ink text-[15px]">
            {wishlistMeta.panelTitle} ({items.length})
          </h2>
          <WishlistGrid items={items} onRemove={handleRemove} onAddToCart={handleAddToCart} />
        </div>
      </main>
    </>
  );
}
