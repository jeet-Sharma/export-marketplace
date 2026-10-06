"use client";

import { useCallback, useSyncExternalStore } from "react";
import { buyerOrderBook as seedOrderBook } from "@/data/buyerOrders";
import type { BuyerOrder } from "@/types/order";

// Shared buyer order history, persisted to localStorage — the same
// pattern as lib/useCart.ts, and for the same reason: CartPage's "Place
// Order" needs to write a real order somewhere that OrdersPage.tsx can
// then read back, instead of the two screens reading two disconnected
// data sources (a static order book vs whatever's actually in the cart).
//
// Implemented with useSyncExternalStore rather than useState + useEffect
// — see useCart.ts for why (avoids an extra post-mount render and the
// react-hooks/set-state-in-effect lint rule).
//
// Unlike the cart (see useCart.ts's EMPTY_CART — an empty cart must stay
// empty), it's fine to seed order *history* with demo rows: past orders
// are read-only display data the buyer didn't just create by loading the
// page, so showing a few example past orders on first visit doesn't put
// words in the buyer's mouth the way seeding their active cart did.
const STORAGE_KEY = "exporthub.buyerOrders";

// useSyncExternalStore compares snapshots by reference — JSON.parse
// always returns a new array, so without caching, getSnapshot would
// look "different" on every render and either warn about an unstable
// snapshot or loop forever. This cache returns the same array reference
// for the same raw stored string, re-parsing only when it actually
// changes — see useCart.ts's readCart for the same pattern.
let cachedRaw: string | null = null;
let cachedOrders: BuyerOrder[] = seedOrderBook;

function readOrders(): BuyerOrder[] {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return seedOrderBook;
  }

  if (raw === cachedRaw) return cachedOrders;

  cachedRaw = raw;
  try {
    cachedOrders = raw ? (JSON.parse(raw) as BuyerOrder[]) : seedOrderBook;
  } catch {
    cachedOrders = seedOrderBook;
  }
  return cachedOrders;
}

// getServerSnapshot must return the same value the server rendered (no
// `window` there) — the demo seed rows are exactly what a first-time
// visitor sees anyway, so this matches readOrders()'s own fallback.
function getServerSnapshot(): BuyerOrder[] {
  return seedOrderBook;
}

function writeOrders(orders: BuyerOrder[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
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

export interface UseBuyerOrdersResult {
  orders: BuyerOrder[];
  /** Adds a newly placed order to the top of the buyer's order history. */
  addOrder: (order: BuyerOrder) => void;
}

export function useBuyerOrders(): UseBuyerOrdersResult {
  const orders = useSyncExternalStore(subscribe, readOrders, getServerSnapshot);

  const addOrder = useCallback((order: BuyerOrder) => {
    const next = [order, ...readOrders()];
    writeOrders(next);
  }, []);

  return { orders, addOrder };
}
