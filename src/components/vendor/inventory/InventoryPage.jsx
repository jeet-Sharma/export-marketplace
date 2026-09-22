"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/vendor/PageHeader";
import TableToolbar from "@/components/vendor/TableToolbar";
import StatRow from "@/components/vendor/dashboard/StatRow";
import LowStockAlert from "@/components/vendor/dashboard/LowStockAlert";
import InventoryTable from "@/components/vendor/inventory/InventoryTable";
import { inventoryItems, inventoryStats, inventoryMeta } from "@/data/inventory";
import { lowStockAlerts } from "@/data/seedData";

export default function InventoryPage() {
  const [query, setQuery] = useState("");

  const visibleItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return inventoryItems;
    return inventoryItems.filter((item) =>
      [item.sku, item.product, item.warehouse].some((field) =>
        field.toLowerCase().includes(term),
      ),
    );
  }, [query]);

  return (
    <>
      <PageHeader
        title="Inventory"
        breadcrumb="Vendor Panel / Inventory"
        actionLabel="+ Stock Entry"
      />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          <StatRow stats={inventoryStats} />
          <LowStockAlert alerts={lowStockAlerts} />
          <div className="flex flex-col gap-4">
            <TableToolbar
              inputId="inventory-search"
              query={query}
              onQueryChange={setQuery}
              placeholder={inventoryMeta.searchPlaceholder}
              actionLabel="Export CSV"
            />
            <InventoryTable items={visibleItems} />
          </div>
        </div>
      </main>
    </>
  );
}
