"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/vendor/PageHeader";
import TableToolbar from "@/components/vendor/TableToolbar";
import StatRow from "@/components/vendor/dashboard/StatRow";
import OrderTable from "@/components/vendor/orders/OrderTable";
import { orderBook, orderStats, ordersMeta } from "@/data/orders";

export default function OrdersPage() {
  const [query, setQuery] = useState("");

  const visibleOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return orderBook;
    return orderBook.filter((order) =>
      [order.id, order.product, order.buyer, order.country].some((field) =>
        field.toLowerCase().includes(term),
      ),
    );
  }, [query]);

  return (
    <>
      <PageHeader
        title="Orders"
        breadcrumb="Vendor Panel / Order Management"
        actionLabel="+ New Order"
      />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          <StatRow stats={orderStats} />
          <div className="flex flex-col gap-4">
            <TableToolbar
              inputId="order-search"
              label="Search orders"
              query={query}
              onQueryChange={setQuery}
              placeholder={ordersMeta.searchPlaceholder}
              actionLabel="Export CSV"
            />
            <OrderTable orders={visibleOrders} />
          </div>
        </div>
      </main>
    </>
  );
}
