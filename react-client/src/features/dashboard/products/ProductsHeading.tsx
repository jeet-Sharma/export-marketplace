"use client";

import { useState } from "react";
import { DownloadIcon, PlusIcon } from "../components/icons";
import { getCookie } from "@/lib/cookies";
import { selectAccessToken } from "@/features/auth/authSelectors";
import { useAppSelector } from "@/store/hooks";
import { API_BASE_URL } from "@/store/baseApi";
import type { AdminProductsQuery } from "./productTypes";

type ProductsHeadingProps = {
  onAddProduct: () => void;
  /** Active filter/sort state forwarded to the backend CSV export. */
  exportQuery?: AdminProductsQuery;
};

export function ProductsHeading({ onAddProduct, exportQuery = {} }: ProductsHeadingProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Read the JWT from Redux state first, fall back to cookie — same
  // resolution order as baseApi.ts so the request is always authenticated.
  const tokenFromStore = useAppSelector(selectAccessToken);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setExportError(null);

    try {
      const token = tokenFromStore ?? getCookie("access_token");

      // Build the query string from the active filters, omitting
      // undefined/empty values so no "undefined" strings reach the backend.
      const params = new URLSearchParams();
      if (exportQuery.search)     params.set("search",     exportQuery.search);
      if (exportQuery.sort)       params.set("sort",       exportQuery.sort);
      if (exportQuery.status)     params.set("status",     exportQuery.status);
      if (exportQuery.categoryId) params.set("categoryId", exportQuery.categoryId);
      if (exportQuery.vendorId)   params.set("vendorId",   exportQuery.vendorId);

      const qs = params.toString();
      const url = `${API_BASE_URL}/admin/products/export/csv${qs ? `?${qs}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }

      // Convert the streamed response to a Blob and trigger a browser download.
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "products.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : "Export failed. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex w-full items-end justify-between">
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-extrabold uppercase text-bloom-pink">
          Catalog operations
        </p>
        <h1 className="text-[30px] font-semibold text-bloom-ink">Products</h1>
        <p className="text-[13px] text-bloom-muted">
          Review listings, trade readiness, supplier verification, and
          publication status.
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          {/* Downloads every matching product as CSV via GET /admin/products/export/csv.
               Columns: Product Name, MOQ, Price, Vendor Name, Status. */}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex h-10 items-center gap-2 rounded-[10px] border border-bloom-border bg-white px-4 text-[13px] font-semibold text-bloom-ink transition-colors hover:bg-bloom-cream disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DownloadIcon className="size-[15px]" />
            {isExporting ? "Exporting…" : "Export CSV"}
          </button>
          <button
            type="button"
            onClick={onAddProduct}
            className="flex h-10 items-center gap-2 rounded-[10px] bg-bloom-pink px-4 text-[13px] font-bold text-white transition-colors hover:bg-pink-hover"
          >
            <PlusIcon className="size-4" />
            Add product
          </button>
        </div>
        {exportError ? (
          <p role="alert" className="text-[12px] font-semibold text-red-600">
            {exportError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
