"use client";

import Link from "next/link";
import { useGetAdminProductQuery } from "./productsApi";

type ProductDetailProps = {
  productId: string;
  /** Back-link target that preserves the active ?role= param. */
  backHref: string;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-extrabold uppercase text-bloom-muted">
        {label}
      </p>
      <p className="text-[14px] font-semibold text-bloom-ink">{value || "—"}</p>
    </div>
  );
}

export function ProductDetail({ productId, backHref }: ProductDetailProps) {
  const { data, isLoading, isError, refetch } =
    useGetAdminProductQuery(productId);

  return (
    <div className="flex w-full flex-col gap-5">
      <Link
        href={backHref}
        className="text-[13px] font-bold text-bloom-pink hover:underline"
      >
        ← Back to products
      </Link>

      {isLoading ? (
        <p className="text-[13px] text-bloom-muted">Loading product…</p>
      ) : isError || !data ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-[14px] font-semibold text-bloom-ink">
            Couldn&apos;t load this product
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-[8px] border border-bloom-pink bg-white px-3 py-1.5 text-[12px] font-bold text-bloom-pink"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-5 rounded-[14px] border border-bloom-border bg-white p-6 shadow-[0px_6px_20px_-4px_rgba(53,16,31,0.07)]">
          <div className="flex flex-col gap-1">
            <h1 className="text-[24px] font-semibold text-bloom-ink">
              {data.name}
            </h1>
            <p className="text-[12px] text-bloom-muted">{data.slug}</p>
          </div>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
            <Field label="Status" value={data.status} />
            <Field
              label="Price"
              value={
                data.price && data.currencyCode
                  ? `${data.currencyCode} ${data.price}`
                  : "Price pending"
              }
            />
            <Field label="Unit" value={data.unit ?? ""} />
            <Field label="MOQ" value={data.moq ?? ""} />
            <Field label="HS code" value={data.hsCode ?? ""} />
            <Field
              label="Export eligibility"
              value={data.exportEligibility ?? ""}
            />
            <Field
              label="Expiry date"
              value={data.expiryDate ? data.expiryDate.split("T")[0] : ""}
            />
          </div>
          {data.description ? (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-extrabold uppercase text-bloom-muted">
                Description
              </p>
              <p className="text-[13px] leading-[1.5] text-bloom-ink">
                {data.description}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
