"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getTierForQuantity, parseMoqToNumber, parsePriceToNumber } from "@/lib/cart";
import type { Product } from "@/lib/products";
import type { CartItem } from "@/types/cart";

// Shared cart state, persisted to localStorage since there is no backend
// cart API yet. This is what lets "Add to Cart" on the public product
// detail page (a page rendered outside the buyer portal entirely) and
// CartPage.tsx agree on the same cart, without either one owning the
// other or a global store dependency being added for one feature.
//
// Implemented with useSyncExternalStore (React's purpose-built API for
// subscribing to state that lives outside React, like localStorage)
// rather than useState + useEffect: reading localStorage after mount via
// setState-in-an-effect works, but triggers an extra render on every
// mount and trips the react-hooks/set-state-in-effect lint rule.
// useSyncExternalStore reads the snapshot during render and only
// re-renders when the store actually notifies a change, with no
// "load real data after the fact" render at all.
const STORAGE_KEY = "exporthub.buyerCart";

// A first-time buyer (nothing in localStorage yet) has a genuinely empty
// cart — this used to fall back to demo seed data ("100 kg of Turmeric,
// 50 bedsheets"), and the moment that buyer did anything (added a real
// item, or even just re-saved the cart), that demo data got written back
// as if the buyer had chosen it, silently inflating their order. An empty
// cart must stay empty; there is nothing to seed it with.
const EMPTY_CART: CartItem[] = [];

// useSyncExternalStore compares snapshots by reference — if getSnapshot
// returns a brand-new array every call (which JSON.parse always does,
// even when the underlying stored string is unchanged), React sees a
// "different" snapshot on every render and either warns about an
// unstable getSnapshot or loops re-rendering forever. This cache makes
// readCart() return the exact same array reference for the same raw
// stored string, only parsing again when the string actually changes.
let cachedRaw: string | null = null;
let cachedItems: CartItem[] = EMPTY_CART;

function readCart(): CartItem[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY_CART;
  }

  if (raw === cachedRaw) return cachedItems;

  cachedRaw = raw;
  try {
    cachedItems = raw ? (JSON.parse(raw) as CartItem[]) : EMPTY_CART;
  } catch {
    cachedItems = EMPTY_CART;
  }
  return cachedItems;
}

// getServerSnapshot — used for the server render and the client's very
// first render before hydration reconciles — must return the same value
// on both sides, so it can't read localStorage (server has no `window`).
// An empty cart is exactly what a first-time visitor's real cart is
// anyway, so this isn't a placeholder standing in for something else.
function getServerSnapshot(): CartItem[] {
  return EMPTY_CART;
}

function writeCart(items: CartItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(STORAGE_KEY));
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(STORAGE_KEY, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(STORAGE_KEY, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
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
  const items = useSyncExternalStore(subscribe, readCart, getServerSnapshot);

  const addItem = useCallback((product: Product, quantity?: number) => {
    const prev = readCart();
    const moq = parseMoqToNumber(product.moq);
    const existing = prev.find((item) => item.productId === product.id);
    const requestedQuantity = quantity ?? moq;
    // Never let a product enter the cart below its own MOQ, whether this
    // is the first unit added or more being added to an existing line —
    // see lib/cart.ts parseMoqToNumber.
    const addedQuantity = Math.max(requestedQuantity, moq);

    const next = existing
      ? prev.map((item) => {
          if (item.productId !== product.id) return item;
          const nextQuantity = Math.max(item.quantity + addedQuantity, moq);
          const tier = getTierForQuantity(product.priceTiers, nextQuantity);
          return {
            ...item,
            quantity: nextQuantity,
            unitPrice: parsePriceToNumber(tier?.price ?? item.unitPrice.toString()),
            priceTiers: product.priceTiers,
          };
        })
      : [
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
    writeCart(next);
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    const prev = readCart();
    const next = prev.map((item) => {
      if (item.id !== itemId) return item;
      // Clamp to the item's own MOQ so editing the quantity directly in
      // the cart table can't drop a line below its minimum order
      // quantity either — same rule addItem enforces.
      const moq = parseMoqToNumber(item.moq);
      const clampedQuantity = Math.max(quantity, moq);
      // Re-derive unitPrice from the new quantity's applicable tier
      // instead of leaving it fixed at whatever tier applied when the
      // item was first added — raising turmeric from 100kg to 500kg must
      // re-price it at the 500+ kg tier, not keep charging the 100-500
      // kg rate.
      const tier = getTierForQuantity(item.priceTiers, clampedQuantity);
      const unitPrice = parsePriceToNumber(tier?.price ?? item.unitPrice.toString());
      return { ...item, quantity: clampedQuantity, unitPrice };
    });
    writeCart(next);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    const next = readCart().filter((item) => item.id !== itemId);
    writeCart(next);
  }, []);

  const clearCart = useCallback(() => {
    writeCart(EMPTY_CART);
  }, []);

  return { items, addItem, updateQuantity, removeItem, clearCart };
}
