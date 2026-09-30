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

function readOrders(): BuyerOrder[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BuyerOrder[]) : seedOrderBook;
  } catch {
    return seedOrderBook;
  }
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
