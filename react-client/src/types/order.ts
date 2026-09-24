import type { OrderStatus } from "@/types/status";

/** One row in the vendor order book (orders list + dashboard recent orders). */
export interface Order {
  id: string;
  product: string;
  buyer: string;
  country: string;
  quantity: string;
  /** Raw USD amount (no currency symbol) — formatted at render time. */
  value: number;
  incoterm: string;
  /** ISO date string (YYYY-MM-DD). */
  placed: string;
  status: OrderStatus;
}

/**
 * Slimmer order shape used by the dashboard's "recent orders" preview,
 * which doesn't need value/incoterm/placed.
 */
export interface RecentOrder {
  id: string;
  product: string;
  buyer: string;
  country: string;
  status: OrderStatus;
}
