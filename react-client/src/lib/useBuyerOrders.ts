"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buyerOrderBook as seedOrderBook } from "@/data/buyerOrders";
import type { BuyerOrder } from "@/types/order";

// Shared buyer order history, persisted to localStorage — the same
// pattern as lib/useCart.ts, and for the same reason: CartPage's "Place
// Order" needs to write a real order somewhere that OrdersPage.tsx can
// then read back, instead of the two screens reading two disconnected
// data sources (a static order book vs whatever's actually in the cart).
//
// Unlike the cart (see useCart.ts's readCart — an empty cart must stay
// empty), it's fine to seed order *history* with demo rows: past orders
// are read-only display data the buyer didn't just create by loading the
// page, so showing a few example past orders on first visit doesn't put
// words in the buyer's mouth the way seeding their active cart did.
const STORAGE_KEY = "exporthub.buyerOrders";

function readOrders(): BuyerOrder[] {
  if (typeof window === "undefined") return seedOrderBook;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BuyerOrder[]) : seedOrderBook;
  } catch {
    return seedOrderBook;
  }
}

function writeOrders(orders: BuyerOrder[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export interface UseBuyerOrdersResult {
  orders: BuyerOrder[];
  /** Adds a newly placed order to the top of the buyer's order history. */
  addOrder: (order: BuyerOrder) => void;
}

export function useBuyerOrders(): UseBuyerOrdersResult {
  // Initial state always matches what the server would have rendered
  // (the static seed) — reading localStorage in the initializer would
  // give the server [seed data] and the client [real stored orders] on
  // the very first render, which is a hydration mismatch. The real
  // client-side contents are loaded in the effect below, after hydration.
  const [orders, setOrders] = useState<BuyerOrder[]>(seedOrderBook);
  // Same "did this change come from a local write or an external sync"
  // tracking as useCart.ts — prevents a sync-triggered update from
  // immediately re-persisting (and re-dispatching) the value it just
  // received, which would loop between instances/tabs.
  const lastPersistedRef = useRef<string | null>(null);

  useEffect(() => {
    const loaded = readOrders();
    lastPersistedRef.current = JSON.stringify(loaded);
    setOrders(loaded);

    function syncFromStorage() {
      const next = readOrders();
      lastPersistedRef.current = JSON.stringify(next);
      setOrders(next);
    }
    window.addEventListener(STORAGE_KEY, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener(STORAGE_KEY, syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  // Persists whenever `orders` actually changes due to a local mutation —
  // kept out of the addOrder callback below since that's a setState
  // updater and must not perform side effects (localStorage write, event
  // dispatch) itself; see useCart.ts for the same reasoning.
  useEffect(() => {
    const serialized = JSON.stringify(orders);
    if (serialized === lastPersistedRef.current) return;
    lastPersistedRef.current = serialized;
    writeOrders(orders);
    window.dispatchEvent(new Event(STORAGE_KEY));
  }, [orders]);

  const addOrder = useCallback((order: BuyerOrder) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  return { orders, addOrder };
}
