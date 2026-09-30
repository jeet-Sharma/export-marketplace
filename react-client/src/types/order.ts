import type { OrderStatus } from "@/types/status";

/**
 * Fields shared by every order row regardless of which side of the trade
 * is looking at it. `Order` (vendor) and `BuyerOrder` (buyer) each extend
 * this with the one field that differs — who the *other* party is: a
 * vendor looking at an incoming order needs to see the buyer, a buyer
 * looking at their own order needs to see the supplier. Keeping that one
 * field out of the shared base (instead of a generic `counterparty`)
 * preserves the more readable `order.buyer` / `order.supplier` call sites
 * across the vendor/buyer order tables.
 */
interface OrderBase {
  id: string;
  product: string;
  country: string;
  quantity: string;
  /** Raw USD amount (no currency symbol) — formatted at render time. */
  value: number;
  incoterm: string;
  /** ISO date string (YYYY-MM-DD). */
  placed: string;
  status: OrderStatus;
}

/** One row in the vendor order book (orders list + dashboard recent orders). */
export interface Order extends OrderBase {
  buyer: string;
}

/**
 * One row in the buyer's own order history — the mirror image of Order.
 * Same shape, but `supplier` replaces `buyer` since from the buyer's
 * side, the counterparty they need to see is who they bought from, not
 * who bought from them.
 */
export interface BuyerOrder extends OrderBase {
  supplier: string;
}

/**
 * Fields shared by the dashboard's "recent orders" preview shape, which
 * doesn't need value/incoterm/placed — see RecentOrder/RecentBuyerOrder.
 */
interface RecentOrderBase {
  id: string;
  product: string;
  country: string;
  status: OrderStatus;
}

/** Slimmer order shape used by the dashboard's "recent orders" preview. */
export interface RecentOrder extends RecentOrderBase {
  buyer: string;
}

/** Slimmer BuyerOrder shape for the buyer dashboard's "recent orders" preview. */
export interface RecentBuyerOrder extends RecentOrderBase {
  supplier: string;
}
