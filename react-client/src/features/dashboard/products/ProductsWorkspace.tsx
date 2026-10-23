"use client";

import { useState } from "react";
import { AddProductModal } from "./AddProductModal";
import { mapApiProductToRow } from "./mapProduct";
import type { ProductSummary } from "./productData";
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
  const { state, setSearch, setSort, setPage, setStatus, setCategoryId } =
    useProductQueryParams();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Primary list query respecting all active filters
  const { data, isLoading, isFetching, isError, refetch } =
    useGetAdminProductsQuery({
      page: state.page,
      pageSize: state.pageSize,
      search: state.search || undefined,
      sort: state.sort,
      status: state.status === "all" ? undefined : state.status,
      categoryId: state.categoryId || undefined,
    });

  // Dedicated queries to calculate live summary counts
  const { data: allData } = useGetAdminProductsQuery({ pageSize: 1 });
  const { data: publishedData } = useGetAdminProductsQuery({
    pageSize: 1,
    status: "PUBLISHED",
  });
  const { data: draftData } = useGetAdminProductsQuery({
    pageSize: 1,
    status: "DRAFT",
  });

  const totalCount = allData?.pagination.totalItems ?? 0;
  const publishedCount = publishedData?.pagination.totalItems ?? 0;
  const draftCount = draftData?.pagination.totalItems ?? 0;

  const publishedPct =
    totalCount > 0 ? Math.round((publishedCount / totalCount) * 100) : 0;

  const dynamicSummaries: ProductSummary[] = [
    {
      key: "all",
      label: "All products",
      value: String(totalCount),
      note: "100% catalog",
      noteTone: "pink",
      icon: "package",
      iconSurface: "bg-[#fbeaf0]",
    },
    {
      key: "published",
      label: "Published",
      value: String(publishedCount),
      note: `${publishedPct}% live`,
      noteTone: "green",
      icon: "badge-check",
      iconSurface: "bg-bloom-green-surface",
    },
    {
      key: "drafts",
      label: "Drafts",
      value: String(draftCount),
      note: `${draftCount} pending`,
      noteTone: "muted",
      icon: "file-pen-line",
      iconSurface: "bg-[#f4f1ee]",
    },
  ];

  const rows = data?.items.map(mapApiProductToRow) ?? [];
  const pagination = data?.pagination;

  // Preserve the active ?role= on links out to the product detail route so a
  // vendor/buyer view doesn't silently reset to admin (see resolveRole).
  const roleQuery = role ? `?role=${role}` : "";
  const buildDetailHref = (id: string) =>
    `/dashboard/products/${id}${roleQuery}`;

  return (
    <>
      <ProductsHeading
        onAddProduct={() => setIsAddProductOpen(true)}
        exportQuery={{
          search: state.search || undefined,
          sort: state.sort,
          status: state.status === "all" ? undefined : state.status,
          categoryId: state.categoryId || undefined,
        }}
      />

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        {dynamicSummaries.map((summary) => {
          const isActive =
            summary.key === "all"
              ? state.status === "all"
              : summary.key === "published"
                ? state.status === "PUBLISHED"
                : state.status === "DRAFT";

          const handleClick = () => {
            if (summary.key === "all") setStatus("all");
            else if (summary.key === "published") setStatus("PUBLISHED");
            else setStatus("DRAFT");
          };

          return (
            <ProductSummaryCard
              key={summary.key}
              summary={summary}
              isActive={isActive}
              onClick={handleClick}
            />
          );
        })}
      </div>

      <ProductControls
        search={state.search}
        sort={state.sort}
        status={state.status}
        categoryId={state.categoryId}
        totalItems={pagination?.totalItems}
        onSearchChange={setSearch}
        onSortChange={setSort}
        onStatusChange={setStatus}
        onCategoryChange={setCategoryId}
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
