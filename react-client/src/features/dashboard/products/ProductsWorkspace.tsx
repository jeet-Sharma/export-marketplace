"use client";

import { useState } from "react";
import { AddProductModal } from "./AddProductModal";
import { mapApiProductToRow } from "./mapProduct";
import { PRODUCT_SUMMARIES } from "./productData";
import { ProductControls } from "./ProductControls";
import { ProductSummaryCard } from "./ProductSummaryCard";
import { ProductsHeading } from "./ProductsHeading";
import { ProductTable } from "./ProductTable";
import { useGetAdminProductsQuery } from "./productsApi";
import { useProductQueryParams } from "./useProductQueryParams";
import type { DashboardRole } from "../config/navConfig";

type ProductsWorkspaceProps = {
  /** Active role, used to preserve ?role= on links out of this workspace. */
  role?: DashboardRole;
};

export function ProductsWorkspace({ role }: ProductsWorkspaceProps) {
  const { state, setSearch, setSort, setPage } = useProductQueryParams();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const { data, isLoading, isFetching, isError, refetch } =
    useGetAdminProductsQuery({
      page: state.page,
      pageSize: state.pageSize,
      search: state.search || undefined,
      sort: state.sort,
    });

  const rows = data?.items.map(mapApiProductToRow) ?? [];
  const pagination = data?.pagination;

  // Preserve the active ?role= on links out to the product detail route so a
  // vendor/buyer view doesn't silently reset to admin (see resolveRole).
  const roleQuery = role ? `?role=${role}` : "";
  const buildDetailHref = (id: string) =>
    `/dashboard/products/${id}${roleQuery}`;

  return (
    <>
      <ProductsHeading rows={rows} onAddProduct={() => setIsAddProductOpen(true)} />

      <div className="flex w-full gap-3">
        {PRODUCT_SUMMARIES.map((summary) => (
          <ProductSummaryCard key={summary.key} summary={summary} />
        ))}
      </div>

      <ProductControls
        search={state.search}
        sort={state.sort}
        totalItems={pagination?.totalItems}
        onSearchChange={setSearch}
        onSortChange={setSort}
      />

      <ProductTable
        rows={rows}
        buildDetailHref={buildDetailHref}
        pagination={pagination}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        onRetry={refetch}
        onPageChange={setPage}
      />

      {isAddProductOpen ? (
        <AddProductModal onClose={() => setIsAddProductOpen(false)} />
      ) : null}
    </>
  );
}
