"use client";

import { useMemo } from "react";
import PageHeader from "@/components/vendor/PageHeader";
import CartTable from "@/components/buyer/cart/CartTable";
import CheckoutSummary from "@/components/buyer/cart/CheckoutSummary";
import { buyerProfileSummary } from "@/data/buyerSeedData";
import { getCartItemCount, getCartTotals } from "@/lib/cart";
import { useCart } from "@/lib/useCart";

// Cart / checkout — no vendor-side equivalent, so this follows the buyer
// portal's general page shape (PageHeader + two-column main content),
// same grid pattern as BuyerRfqPage.tsx's table + side-panel layout.
//
// Cart state comes from useCart() (localStorage-backed) instead of local
// useState seeded from static data, so a product added from the public
// product detail page's "Add to Cart"/"Buy Now" buttons shows up here.
export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCart();

  const totals = useMemo(() => getCartTotals(items), [items]);
  const itemCount = useMemo(() => getCartItemCount(items), [items]);

  return (
    <>
      <PageHeader
        title="Cart"
        breadcrumb="Buyer Panel / Cart & Checkout"
        verified={buyerProfileSummary.verified}
        verifiedLabel="Verified Buyer"
      />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CartTable
              items={items}
              onQuantityChange={(item, quantity) => updateQuantity(item.id, quantity)}
              onRemove={(item) => removeItem(item.id)}
            />
          </div>
          <div className="lg:col-span-1">
            <CheckoutSummary totals={totals} itemCount={itemCount} />
          </div>
        </div>
      </main>
    </>
  );
}
