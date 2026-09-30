"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/vendor/PageHeader";
import TableToolbar from "@/components/vendor/TableToolbar";
import StatRow from "@/components/vendor/dashboard/StatRow";
import BuyerOrderTable from "@/components/buyer/orders/BuyerOrderTable";
import { buyerOrderBook, buyerOrderStats, buyerOrdersMeta } from "@/data/buyerOrders";
import { buyerProfileSummary } from "@/data/buyerSeedData";

// Buyer's own order history — mirrors vendor/orders/OrdersPage.tsx
// (same stat row + search + table composition), reading the buyer's
// order book instead of the vendor's incoming orders.
export default function OrdersPage() {
  const [query, setQuery] = useState("");

  const visibleOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return buyerOrderBook;
    return buyerOrderBook.filter((order) =>
      [order.id, order.product, order.supplier, order.country].some((field) =>
        field.toLowerCase().includes(term),
      ),
    );
  }, [query]);

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
            <BuyerOrderTable orders={visibleOrders} />
          </div>
        </div>
      </main>
    </>
  );
}
