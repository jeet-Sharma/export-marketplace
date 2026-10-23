"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useGetAdminProductQuery,
  usePublishAdminProductMutation,
  useUnpublishAdminProductMutation,
} from "./productsApi";
import { EditProductModal } from "./EditProductModal";
import { deleteCookie } from "@/lib/cookies";

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
  const [publish, { isLoading: isPublishing }] = usePublishAdminProductMutation();
  const [unpublish, { isLoading: isUnpublishing }] =
    useUnpublishAdminProductMutation();

  const [isEditOpen, setIsEditOpen] = useState(false);

  const isBusy = isPublishing || isUnpublishing;
  const isPublished = data?.status === "PUBLISHED";

  const handleTogglePublish = async () => {
    if (!data) return;
    try {
      if (isPublished) {
        await unpublish(data.id).unwrap();
      } else {
        await publish(data.id).unwrap();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="text-[13px] font-bold text-bloom-pink hover:underline"
        >
          ← Back to products
        </Link>

        {data && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="rounded-[8px] border border-bloom-border bg-white px-3 py-1.5 text-[12px] font-semibold text-bloom-ink hover:bg-bloom-cream"
            >
              Edit Product
            </button>
            <button
              type="button"
              onClick={handleTogglePublish}
              disabled={isBusy}
              className={`rounded-[8px] px-3.5 py-1.5 text-[12px] font-bold transition-opacity disabled:opacity-50 ${
                isPublished
                  ? "border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  : "bg-bloom-pink text-white hover:opacity-95"
              }`}
            >
              {isBusy ? "Updating…" : isPublished ? "Unpublish" : "Publish Listing"}
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <p className="text-[13px] text-bloom-muted">Loading product…</p>
      ) : isError || !data ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-[14px] font-semibold text-bloom-ink">
            Couldn&apos;t load this product
          </p>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-[8px] border border-bloom-border bg-white px-3 py-1.5 text-[12px] font-bold text-bloom-ink hover:bg-bloom-cream"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={() => {
                deleteCookie("access_token");
                deleteCookie("user_data");
                window.location.href = "/login?force=true";
              }}
              className="rounded-[8px] bg-bloom-pink px-4 py-1.5 text-[12px] font-bold text-white hover:opacity-90"
            >
              Log in again
            </button>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-5 rounded-[14px] border border-bloom-border bg-white p-6 shadow-[0px_6px_20px_-4px_rgba(53,16,31,0.07)]">
          <div className="flex flex-col gap-1 border-b border-[#eee9e4] pb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] font-semibold text-bloom-ink">
                {data.name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                  isPublished
                    ? "bg-bloom-green-surface text-bloom-green"
                    : "bg-[#f4f1ee] text-bloom-muted"
                }`}
              >
                {data.status}
              </span>
            </div>
            <p className="text-[12px] text-bloom-muted">Slug: {data.slug}</p>
          </div>

          <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
            <Field
              label="Vendor / Supplier"
              value={data.vendor?.companyName ?? data.vendor?.displayName ?? data.vendorId}
            />
            <Field
              label="Category"
              value={data.category?.name ?? "Uncategorized"}
            />
            <Field
              label="Origin Country"
              value={data.sourceCountry?.name ?? data.sourceCountryId ?? "—"}
            />
            <Field
              label="Base Price"
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
            <Field
              label="Created At"
              value={new Date(data.createdAt).toLocaleDateString()}
            />
            <Field
              label="Last Updated"
              value={new Date(data.updatedAt).toLocaleDateString()}
            />
          </div>

          {data.description ? (
            <div className="flex flex-col gap-1 border-t border-[#eee9e4] pt-4">
              <p className="text-[10px] font-extrabold uppercase text-bloom-muted">
                Description
              </p>
              <p className="text-[13px] leading-[1.5] text-bloom-ink">
                {data.description}
              </p>
            </div>
          ) : null}

          {/* Edit Modal */}
          <EditProductModal
            isOpen={isEditOpen}
            product={data}
            onClose={() => setIsEditOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
