"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { wishlistItems as seedWishlistItems } from "@/data/buyerWishlist";
import type { WishlistItem } from "@/types/wishlist";

// Shared wishlist state, persisted to localStorage — same pattern as
// lib/useCart.ts and lib/useBuyerOrders.ts, and for the same reason:
// WishlistPage previously kept removed items in plain useState, which
// re-initializes from the static seed on every remount (leaving the page
// and coming back, or a refresh), so anything the buyer removed just
// reappeared. Persisting to storage is what makes a remove stick.
//
// Seeding from demo data on first visit is fine here (unlike the cart,
// see useCart.ts's readCart) — a wishlist entry is something the buyer
// is shown as already saved, not something that gets silently treated as
// a chosen purchase the moment they interact with the page.
const STORAGE_KEY = "exporthub.buyerWishlist";

function readWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return seedWishlistItems;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WishlistItem[]) : seedWishlistItems;
  } catch {
    return seedWishlistItems;
  }
}

function writeWishlist(items: WishlistItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export interface UseWishlistResult {
  items: WishlistItem[];
  removeItem: (itemId: string) => void;
}

export function useWishlist(): UseWishlistResult {
  // Initial state always matches what the server would have rendered
  // (the static seed) — reading localStorage in the initializer would
  // give the server [seed data] and the client [real stored wishlist] on
  // the very first render, a hydration mismatch. Real client-side
  // contents are loaded in the effect below, after hydration.
  const [items, setItems] = useState<WishlistItem[]>(seedWishlistItems);
  // Same "local mutation vs external sync" tracking as useCart.ts, to
  // avoid a sync-triggered update looping back into another write+dispatch.
  const lastPersistedRef = useRef<string | null>(null);

  useEffect(() => {
    const loaded = readWishlist();
    lastPersistedRef.current = JSON.stringify(loaded);
    setItems(loaded);

    function syncFromStorage() {
      const next = readWishlist();
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

  // Persists whenever `items` actually changes due to a local mutation —
  // kept out of the removeItem callback below since that's a setState
  // updater and must not perform side effects itself; see useCart.ts.
  useEffect(() => {
    const serialized = JSON.stringify(items);
    if (serialized === lastPersistedRef.current) return;
    lastPersistedRef.current = serialized;
    writeWishlist(items);
    window.dispatchEvent(new Event(STORAGE_KEY));
  }, [items]);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  return { items, removeItem };
}
