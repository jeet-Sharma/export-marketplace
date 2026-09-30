"use client";

import { useCallback, useEffect, useState } from "react";
import { cartMeta } from "@/data/buyerCart";
import { parsePriceToNumber } from "@/lib/cart";
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

function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : cartMeta.seedOnEmpty;
  } catch {
    return cartMeta.seedOnEmpty;
  }
}

function writeCart(items: CartItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(STORAGE_KEY));
}

export interface UseCartResult {
  items: CartItem[];
  addItem: (product: Product, quantity: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
}

export function useCart(): UseCartResult {
  const [items, setItems] = useState<CartItem[]>(() => readCart());

  useEffect(() => {
    function syncFromStorage() {
      setItems(readCart());
    }
    window.addEventListener(STORAGE_KEY, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener(STORAGE_KEY, syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  const addItem = useCallback((product: Product, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      const next = existing
        ? prev.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          )
        : [
            ...prev,
            {
              id: `cart-${product.id}`,
              productId: product.id,
              name: product.name,
              emoji: product.emoji,
              supplierName: product.supplier.name,
              unitPrice: parsePriceToNumber(product.priceTiers[0]?.price ?? "0"),
              quantity,
              moq: product.moq,
            },
          ];
      writeCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setItems((prev) => {
      const next = prev.map((item) => (item.id === itemId ? { ...item, quantity } : item));
      writeCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== itemId);
      writeCart(next);
      return next;
    });
  }, []);

  return { items, addItem, updateQuantity, removeItem };
}
