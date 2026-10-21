"use client";

import { DownloadIcon, PlusIcon } from "../components/icons";
import type { ProductRow } from "./productData";

type ProductsHeadingProps = {
  rows: ProductRow[];
  onAddProduct: () => void;
};

/** Serialize the currently loaded rows to a CSV string, quoting every field. */
function rowsToCsv(rows: ProductRow[]): string {
  const header = ["Name", "Price", "Status", "Trade setup"];
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.name, r.price, r.publication, r.tradeSetup.join(" · ")]
      .map(escape)
      .join(","),
  );
  return [header.map(escape).join(","), ...lines].join("\r\n");
}

export function ProductsHeading({ rows, onAddProduct }: ProductsHeadingProps) {
  const handleExport = () => {
    const csv = rowsToCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "products.csv";
    link.click();
    URL.revokeObjectURL(url);
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
      <div className="flex shrink-0 items-start gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={rows.length === 0}
          className="flex h-10 items-center gap-2 rounded-[10px] border border-bloom-border bg-white px-4 text-[13px] font-semibold text-bloom-ink transition-colors hover:bg-bloom-cream disabled:cursor-not-allowed disabled:opacity-50"
        >
          <DownloadIcon className="size-[15px]" />
          Export CSV
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
    </div>
  );
}
