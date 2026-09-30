"use client";

import { useState } from "react";
import PageHeader from "@/components/vendor/PageHeader";
import WishlistGrid from "@/components/buyer/wishlist/WishlistGrid";
import { wishlistItems as initialWishlistItems, wishlistMeta } from "@/data/buyerWishlist";
import { buyerProfileSummary } from "@/data/buyerSeedData";
import type { WishlistItem } from "@/types/wishlist";

// Buyer wishlist — no vendor-side equivalent, so this follows the buyer
// portal's general page shape (PageHeader + main content column) rather
// than mirroring a specific vendor page.
export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>(initialWishlistItems);

  function handleRemove(item: WishlistItem) {
    setItems((prev) => prev.filter((existing) => existing.id !== item.id));
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
          <WishlistGrid items={items} onRemove={handleRemove} />
        </div>
      </main>
    </>
  );
}
