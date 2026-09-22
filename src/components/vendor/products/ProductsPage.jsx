"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/vendor/PageHeader";
import TableToolbar from "@/components/vendor/TableToolbar";
import ProductTable from "@/components/vendor/products/ProductTable";
import { productCatalog, productsMeta } from "@/data/products";

export default function ProductsPage() {
  const [query, setQuery] = useState("");

  const visibleProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return productCatalog;
    return productCatalog.filter((product) =>
      [product.name, product.hsCode, product.stage].some((field) =>
        field.toLowerCase().includes(term),
      ),
    );
  }, [query]);

  return (
    <>
      <PageHeader
        title="Products"
        breadcrumb="Vendor Panel / Product Management"
        actionLabel="+ New Product"
      />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4">
          <TableToolbar
            inputId="product-search"
            query={query}
            onQueryChange={setQuery}
            placeholder={productsMeta.searchPlaceholder}
            actionLabel="+ Add Product"
          />
          <ProductTable products={visibleProducts} />
        </div>
      </main>
    </>
  );
}
