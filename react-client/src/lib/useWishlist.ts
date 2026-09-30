"use client";

import { useCallback, useSyncExternalStore } from "react";
import { wishlistItems as seedWishlistItems } from "@/data/buyerWishlist";
import type { WishlistItem } from "@/types/wishlist";

// Shared wishlist state, persisted to localStorage — same pattern as
// lib/useCart.ts and lib/useBuyerOrders.ts, and for the same reason:
// WishlistPage previously kept removed items in plain useState, which
// re-initializes from the static seed on every remount (leaving the page
// and coming back, or a refresh), so anything the buyer removed just
// reappeared. Persisting to storage is what makes a remove stick.
//
// Implemented with useSyncExternalStore rather than useState + useEffect
// — see useCart.ts for why (avoids an extra post-mount render and the
// react-hooks/set-state-in-effect lint rule).
//
// Seeding from demo data on first visit is fine here (unlike the cart,
// see useCart.ts's EMPTY_CART) — a wishlist entry is something the buyer
// is shown as already saved, not something that gets silently treated as
// a chosen purchase the moment they interact with the page.
const STORAGE_KEY = "exporthub.buyerWishlist";

function readWishlist(): WishlistItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WishlistItem[]) : seedWishlistItems;
  } catch {
    return seedWishlistItems;
  }
}

// getServerSnapshot must return the same value the server rendered (no
// `window` there) — matches readWishlist()'s own fallback.
function getServerSnapshot(): WishlistItem[] {
  return seedWishlistItems;
}

function writeWishlist(items: WishlistItem[]) {
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

export interface UseWishlistResult {
  items: WishlistItem[];
  removeItem: (itemId: string) => void;
}

export function useWishlist(): UseWishlistResult {
  const items = useSyncExternalStore(subscribe, readWishlist, getServerSnapshot);

  const removeItem = useCallback((itemId: string) => {
    const next = readWishlist().filter((item) => item.id !== itemId);
    writeWishlist(next);
  }, []);

  return { items, removeItem };
}
