"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/vendor/PageHeader";
import TableToolbar from "@/components/vendor/TableToolbar";
import StatRow from "@/components/vendor/dashboard/StatRow";
import BuyerOrderTable from "@/components/buyer/orders/BuyerOrderTable";
import { buyerOrderStats, buyerOrdersMeta } from "@/data/buyerOrders";
import { buyerProfileSummary } from "@/data/buyerSeedData";
import { useBuyerOrders } from "@/lib/useBuyerOrders";
import type { BuyerOrder } from "@/types/order";

// Buyer's own order history — mirrors vendor/orders/OrdersPage.tsx
// (same stat row + search + table composition). Order data comes from
// useBuyerOrders() (localStorage-backed) instead of the static order book
// directly, so an order placed via CartPage.tsx's checkout shows up here
// too, instead of the two screens reading disconnected data.
export default function OrdersPage() {
  const [query, setQuery] = useState("");
  const [noticeOrderId, setNoticeOrderId] = useState<string | null>(null);
  const { orders } = useBuyerOrders();

  const visibleOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) =>
      [order.id, order.product, order.supplier, order.country].some((field) =>
        field.toLowerCase().includes(term),
      ),
    );
  }, [orders, query]);

  // There is no per-order detail page yet to send View/Track/Invoice to —
  // this is already the full order list, so there's nowhere further to
  // navigate. Rather than leave the row action disabled with no
  // explanation, clicking it surfaces an inline status note for that
  // order, the same "acknowledge the click, be honest about what's not
  // built yet" pattern used elsewhere (RfqForm's submitted state,
  // CheckoutSummary's placed state) instead of a silent no-op.
  function handleRowAction(order: BuyerOrder) {
    setNoticeOrderId(order.id);
  }

  return (
    <>
      <PageHeader
        title="Orders"
        breadcrumb="Buyer Panel / Order History"
        verified={buyerProfileSummary.verified}
        verifiedLabel="Verified Buyer"
      />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          <StatRow stats={buyerOrderStats} />
          <div className="flex flex-col gap-4">
            <TableToolbar
              inputId="buyer-order-search"
              label="Search orders"
              query={query}
              onQueryChange={setQuery}
              placeholder={buyerOrdersMeta.searchPlaceholder}
            />
            {noticeOrderId && (
              <p className="font-body text-text-dim text-[12px]">
                Order tracking, invoices and reordering aren&apos;t connected to a backend yet —
                order {noticeOrderId} details will appear here once they are.
              </p>
            )}
            <BuyerOrderTable orders={visibleOrders} onRowAction={handleRowAction} />
          </div>
        </div>
      </main>
    </>
  );
}
