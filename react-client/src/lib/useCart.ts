"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getTierForQuantity, parseMoqToNumber, parsePriceToNumber } from "@/lib/cart";
import type { Product } from "@/lib/products";
import type { CartItem } from "@/types/cart";

// Shared cart state, persisted to localStorage since there is no backend
// cart API yet. This is what lets "Add to Cart" on the public product
// detail page (a page rendered outside the buyer portal entirely) and
// CartPage.tsx agree on the same cart, without either one owning the
// other or a global store dependency being added for one feature.
//
// A "storage" event listener keeps every mounted useCart() instance (e.g.
// the product page and an open cart tab) in sync with each other; within
// a single tab, each hook instance also re-reads after its own writes so
// the calling component re-renders immediately.
const STORAGE_KEY = "exporthub.buyerCart";

// A first-time buyer (nothing in localStorage yet) has a genuinely empty
// cart — this used to fall back to demo seed data ("100 kg of Turmeric,
// 50 bedsheets"), and the moment that buyer did anything (added a real
// item, or even just re-saved the cart), that demo data got written back
// as if the buyer had chosen it, silently inflating their order. An empty
// cart must stay empty; there is nothing to seed it with.
function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(STORAGE_KEY));
}

export interface UseCartResult {
  items: CartItem[];
  /**
   * Adds a product to the cart. `quantity` defaults to the product's own
   * MOQ (see lib/cart.ts parseMoqToNumber) rather than a flat 1, and any
   * quantity below that MOQ is clamped up to it — a buyer should never be
   * able to add less than a supplier's minimum order quantity. The line
   * item's price is picked from whichever tier the resulting quantity
   * actually qualifies for (lib/cart.ts getTierForQuantity), not always
   * the first tier.
   */
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  /** Empties the cart — called after an order is successfully placed, so
   * the items just purchased don't linger as if they were never ordered. */
  clearCart: () => void;
}

export function useCart(): UseCartResult {
  // Always start from an empty, SSR-safe cart — reading localStorage
  // during the initializer would return [] on the server and real
  // contents on the client's first render, producing different markup
  // for the same component and triggering a hydration mismatch. The
  // real contents are loaded in the effect below, which only runs after
  // hydration completes.
  const [items, setItems] = useState<CartItem[]>([]);
  // Tracks the JSON this instance last wrote or read from storage, so the
  // persistence effect below can tell "items changed because the user
  // did something" apart from "items changed because we just synced in
  // a value that was already on disk" — without this, syncing from a
  // storage/cross-instance event would immediately re-write + re-dispatch
  // the same value, which every other instance would then sync again,
  // looping forever.
  const lastPersistedRef = useRef<string | null>(null);

  useEffect(() => {
    const loaded = readCart();
    lastPersistedRef.current = JSON.stringify(loaded);
    setItems(loaded);

    function syncFromStorage() {
      const next = readCart();
      lastPersistedRef.current = JSON.stringify(next);
      setItems(next);
    }
    window.addEventListener(STORAGE_KEY, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener(STORAGE_KEY, syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  // Persists to localStorage whenever `items` changes, as its own effect
  // rather than inside the setItems updater functions below — writing to
  // localStorage and dispatching an event are side effects, and an
  // updater function can run during React's render phase (e.g. under
  // StrictMode's double-invoke), so it must not perform side effects
  // itself.
  useEffect(() => {
    const serialized = JSON.stringify(items);
    if (serialized === lastPersistedRef.current) return;
    lastPersistedRef.current = serialized;
    writeCart(items);
  }, [items]);

  const addItem = useCallback((product: Product, quantity?: number) => {
    setItems((prev) => {
      const moq = parseMoqToNumber(product.moq);
      const existing = prev.find((item) => item.productId === product.id);
      const requestedQuantity = quantity ?? moq;
      // Never let a product enter the cart below its own MOQ, whether
      // this is the first unit added or more being added to an existing
      // line — see lib/cart.ts parseMoqToNumber.
      const addedQuantity = Math.max(requestedQuantity, moq);

      if (existing) {
        return prev.map((item) => {
          if (item.productId !== product.id) return item;
          const nextQuantity = Math.max(item.quantity + addedQuantity, moq);
          const tier = getTierForQuantity(product.priceTiers, nextQuantity);
          return {
            ...item,
            quantity: nextQuantity,
            unitPrice: parsePriceToNumber(tier?.price ?? item.unitPrice.toString()),
            priceTiers: product.priceTiers,
          };
        });
      }

      return [
        ...prev,
        {
          id: `cart-${product.id}`,
          productId: product.id,
          name: product.name,
          emoji: product.emoji,
          supplierName: product.supplier.name,
          unitPrice: parsePriceToNumber(
            getTierForQuantity(product.priceTiers, addedQuantity)?.price ?? "0",
          ),
          quantity: addedQuantity,
          moq: product.moq,
          priceTiers: product.priceTiers,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        // Clamp to the item's own MOQ so editing the quantity directly in
        // the cart table can't drop a line below its minimum order
        // quantity either — same rule addItem enforces.
        const moq = parseMoqToNumber(item.moq);
        const clampedQuantity = Math.max(quantity, moq);
        // Re-derive unitPrice from the new quantity's applicable tier
        // instead of leaving it fixed at whatever tier applied when the
        // item was first added — raising turmeric from 100kg to 500kg
        // must re-price it at the 500+ kg tier, not keep charging the
        // 100-500 kg rate.
        const tier = getTierForQuantity(item.priceTiers, clampedQuantity);
        const unitPrice = parsePriceToNumber(tier?.price ?? item.unitPrice.toString());
        return { ...item, quantity: clampedQuantity, unitPrice };
      }),
    );
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  return { items, addItem, updateQuantity, removeItem, clearCart };
}
