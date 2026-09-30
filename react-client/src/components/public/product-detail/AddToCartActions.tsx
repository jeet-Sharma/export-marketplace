"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Button from "@/components/ui/Button";
import { useCart } from "@/lib/useCart";
import { routes } from "@/config/routes";
import type { Product } from "@/lib/products";

export interface AddToCartActionsProps {
  product: Product;
}

// Client island for the one interactive piece of an otherwise server-
// rendered product detail page: adding the viewed product to the shared
// cart (see lib/useCart.ts). "Buy Now" adds one unit and goes straight to
// checkout; "Add to Cart" adds one unit and stays on the page so the
// buyer can keep browsing, confirming the add with inline feedback
// instead of a silent no-op.
export default function AddToCartActions({ product }: AddToCartActionsProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addItem(product, 1);
    setAdded(true);
  }

  function handleBuyNow() {
    addItem(product, 1);
    router.push(routes.buyerCart);
  }

  return (
    <div className="flex flex-col gap-2 pt-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="accent" size="md" className="flex-1" onClick={handleBuyNow}>
          Buy Now
        </Button>
        <Button variant="ghost" size="md" className="flex-1" onClick={handleAddToCart}>
          Add to Cart
        </Button>
        <a href="#rfq-form" className="flex-1">
          <Button variant="ghost" size="md" className="w-full">
            Request Quote
          </Button>
        </a>
      </div>
      {added && (
        <p className="font-body text-teal text-[12px]">
          {"\u2713"} Added to cart.{" "}
          <a href={routes.buyerCart} className="underline hover:opacity-80">
            View cart
          </a>
        </p>
      )}
    </div>
  );
}
