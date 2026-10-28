"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { PlusIcon } from "../components/icons";
import { SelectField, TextField } from "./AddProductFormFields";
import {
  useCreateProductMutation,
  useUpdateAdminProductMutation,
  useRequestImageUploadUrlMutation,
  useAddProductImageMutation,
  usePublishAdminProductMutation,
  useUnpublishAdminProductMutation,
} from "./productsApi";
import {
  useGetCategoryOptionsQuery,
  useGetCountryOptionsQuery,
} from "./referenceDataApi";
import type { CreateProductPayload } from "./productTypes";
import { useGetAdminVendorsQuery } from "../vendors/vendorsApi";
import { AccessibleDialog } from "@/components/ui/AccessibleDialog";

type ExtraDetailValueType = "Text" | "Number" | "Color";

type ExtraDetailRow = {
  id: string;
  label: string;
  valueType: ExtraDetailValueType;
  value: string;
};

type SelectedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type AddProductModalProps = {
  onClose: () => void;
  onSuccess?: (createdStatus?: "DRAFT" | "PUBLISHED") => void;
};

const EXPORT_ELIGIBILITY_OPTIONS = [
  { value: "ELIGIBLE", label: "Allowed" },
  { value: "RESTRICTED", label: "Restricted" },
  { value: "PENDING", label: "Pending review" },
];

/** Converts a whole-number months value into a calendar date N months from today (YYYY-MM-DD), matching CreateProductDto.expiryDate's strict format. */
function monthsFromNowToIsoDate(months: number): string {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

function emptyDetailRow(): ExtraDetailRow {
  return { id: crypto.randomUUID(), label: "", valueType: "Text", value: "" };
}

function messageFromUnknown(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "data" in err) {
    const data = (err as { data?: { message?: string | string[] } }).data;
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (Array.isArray(data?.message) && data.message.length > 0) {
      return data.message.join(", ");
    }
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return fallback;
}

export function AddProductModal({ onClose, onSuccess }: AddProductModalProps) {
  const headingId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useGetCategoryOptionsQuery();
  const { data: countries } = useGetCountryOptionsQuery();
  const { data: vendorsResult } = useGetAdminVendorsQuery();
  const [createProduct, { isLoading: isCreating, error }] =
    useCreateProductMutation();
  const [updateProduct] = useUpdateAdminProductMutation();
  const [publishProduct] = usePublishAdminProductMutation();
  const [unpublishProduct] = useUnpublishAdminProductMutation();
  const [requestImageUploadUrl] = useRequestImageUploadUrlMutation();
  const [addProductImage] = useAddProductImageMutation();

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDetails, setFullDetails] = useState("");

  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdProduct, setCreatedProduct] = useState<{
    id: string;
    status: "DRAFT" | "PUBLISHED";
  } | null>(null);
  const [uploadedImageIds, setUploadedImageIds] = useState<string[]>([]);

  const [quantityTiers, setQuantityTiers] = useState("");
  const [moq, setMoq] = useState("");
  const [hsCode, setHsCode] = useState("");
  const [exportEligibility, setExportEligibility] = useState("");
  const [sourceCountryId, setSourceCountryId] = useState("");
  const [shippingCountryId, setShippingCountryId] = useState("");
  const [deliveryEstimate, setDeliveryEstimate] = useState("");
  const [expiryMonths, setExpiryMonths] = useState("");

  const [vendorId, setVendorId] = useState("");
  const [price, setPrice] = useState("");
  const [shippingEstimate, setShippingEstimate] = useState("");
  const [dutiesEstimate, setDutiesEstimate] = useState("");
  const [taxesEstimate, setTaxesEstimate] = useState("");

  const [extraDetails, setExtraDetails] = useState<ExtraDetailRow[]>([
    emptyDetailRow(),
  ]);

  const vendorOptions = (vendorsResult?.items ?? []).map((vendor) => ({
    value: vendor.id,
    label: vendor.displayName || vendor.companyName || vendor.id,
  }));
  const categoryOptions = (categories ?? []).map((category) => ({
    value: category.id,
    label: category.name,
  }));
  const countryOptions = (countries ?? []).map((country) => ({
    value: country.id,
    label: `${country.name} (${country.iso2Code})`,
  }));

  const mutationError = (() => {
    if (!error) return null;
    if ("data" in error && typeof error.data === "object" && error.data !== null) {
      const data = error.data as { message?: string | string[] };
      if (data.message) {
        return Array.isArray(data.message) ? data.message.join(", ") : data.message;
      }
    }
    return "Could not save this product. Check the required fields (name and supplier) and try again.";
  })();
  const errorMessage = submitError ?? mutationError;

  function buildPayload(status: "DRAFT" | "PUBLISHED"): CreateProductPayload {
    const parsedMoq = Number(moq);
    const parsedPrice = Number(price);
    const parsedExpiryMonths = Number(expiryMonths);

    return {
      name: name.trim(),
      // shortDescription maps to the only free-text description field the
      // backend exposes (CreateProductDto.description). fullDetails has no
      // dedicated column yet and is intentionally excluded — see doc comment.
      description: shortDescription.trim() || undefined,
      categoryId: categoryId || undefined,
      vendorId,
      status,
      price: price && Number.isFinite(parsedPrice) ? parsedPrice : undefined,
      currencyCode: price ? "USD" : undefined,
      unit: moq || price ? "kg" : undefined,
      moq: moq && Number.isFinite(parsedMoq) ? parsedMoq : undefined,
      hsCode: hsCode.trim() || undefined,
      sourceCountryId: sourceCountryId || undefined,
      targetCountryIds: shippingCountryId ? [shippingCountryId] : undefined,
      exportEligibility: exportEligibility || undefined,
      estimatedDeliveryText: deliveryEstimate.trim() || undefined,
      dutiesTaxesNote:
        dutiesEstimate || taxesEstimate || shippingEstimate
          ? [
              shippingEstimate ? `Shipping est. ${shippingEstimate} USD` : null,
              dutiesEstimate ? `Duties est. ${dutiesEstimate} USD` : null,
              taxesEstimate ? `Taxes est. ${taxesEstimate} USD` : null,
            ]
              .filter(Boolean)
              .join(" · ")
          : undefined,
      expiryDate:
        expiryMonths && Number.isFinite(parsedExpiryMonths)
          ? monthsFromNowToIsoDate(parsedExpiryMonths)
          : undefined,
    };
  }

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImageError(null);

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxBytes = 5 * 1024 * 1024; // 5MB

    const newImages: SelectedImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!validTypes.includes(file.type)) {
        setImageError("Only JPG, PNG, and WebP images are supported.");
        continue;
      }
      if (file.size > maxBytes) {
        setImageError(`"${file.name}" exceeds the 5MB file size limit.`);
        continue;
      }
      newImages.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (newImages.length > 0) {
      setSelectedImages((prev) => [...prev, ...newImages]);
    }
  };

  const handleRemoveImage = (id: string) => {
    setSelectedImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((img) => img.id !== id);
    });
  };

  async function handleSubmit(status: "DRAFT" | "PUBLISHED") {
    if (!name.trim() || !vendorId) {
      return;
    }
    setImageError(null);
    setSubmitError(null);
    const uploaded = new Set(uploadedImageIds);
    let saved = createdProduct;
    try {
      setUploadProgress(
        status === "PUBLISHED" ? "Publishing product…" : "Saving draft…",
      );

      const payload = buildPayload(status);
      if (!saved) {
        const created = await createProduct(payload).unwrap();
        saved = { id: created.id, status };
        setCreatedProduct(saved);
      } else {
        await updateProduct({
          id: saved.id,
          data: {
            name: payload.name,
            vendorId: payload.vendorId,
            description: payload.description ?? null,
            categoryId: payload.categoryId ?? null,
            price: payload.price ?? null,
            currencyCode: payload.currencyCode ?? null,
            unit: payload.unit ?? null,
            moq: payload.moq ?? null,
            hsCode: payload.hsCode ?? null,
            sourceCountryId: payload.sourceCountryId ?? null,
            targetCountryIds: payload.targetCountryIds ?? [],
            exportEligibility: payload.exportEligibility ?? null,
            countryRestrictions: payload.countryRestrictions ?? null,
            estimatedDeliveryText: payload.estimatedDeliveryText ?? null,
            dutiesTaxesNote: payload.dutiesTaxesNote ?? null,
            expiryDate: payload.expiryDate ?? null,
          },
        }).unwrap();
        if (saved.status !== status) {
          if (status === "PUBLISHED") {
            await publishProduct(saved.id).unwrap();
          } else {
            await unpublishProduct(saved.id).unwrap();
          }
          saved = { id: saved.id, status };
          setCreatedProduct(saved);
        }
      }

      const pendingImages = selectedImages.filter((item) => !uploaded.has(item.id));
      for (let i = 0; i < pendingImages.length; i++) {
        const item = pendingImages[i];
        setUploadProgress(
          `Uploading image ${i + 1} of ${pendingImages.length}…`,
        );

        const uploadInfo = await requestImageUploadUrl({
          productId: saved.id,
          filename: item.file.name,
          contentType: item.file.type,
          contentLengthBytes: item.file.size,
        }).unwrap();

        if (uploadInfo.fields) {
          const formData = new FormData();
          for (const [k, v] of Object.entries(uploadInfo.fields)) {
            formData.append(k, v);
          }
          formData.append("file", item.file);
          const uploadRes = await fetch(uploadInfo.uploadUrl, {
            method: uploadInfo.httpMethod || "POST",
            body: formData,
          });
          if (!uploadRes.ok) {
            throw new Error(`Failed to upload ${item.file.name}`);
          }
        } else {
          const uploadRes = await fetch(uploadInfo.uploadUrl, {
            method: uploadInfo.httpMethod || "PUT",
            headers: { "Content-Type": item.file.type },
            body: item.file,
          });
          if (!uploadRes.ok) {
            throw new Error(`Failed to upload ${item.file.name}`);
          }
        }

        await addProductImage({
          productId: saved.id,
          objectKey: uploadInfo.key || uploadInfo.objectKey || "",
          isPrimary: uploaded.size === 0 && i === 0,
          sortOrder: uploaded.size + i,
          altText: name.trim() || item.file.name,
        }).unwrap();

        uploaded.add(item.id);
        setUploadedImageIds([...uploaded]);
      }

      selectedImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));

      if (onSuccess) {
        onSuccess(status);
      } else {
        onClose();
      }
    } catch (err) {
      const detail = messageFromUnknown(err, "");
      setSubmitError(
        saved
          ? `${detail ? `${detail} ` : ""}The product was saved. Retry to finish the remaining images without creating a duplicate.`
          : detail ||
              "Could not save this product. Check the required fields (name and supplier) and try again.",
      );
    } finally {
      setUploadProgress(null);
    }
  }

  function updateDetailRow(id: string, patch: Partial<ExtraDetailRow>) {
    setExtraDetails((rows) =>
      rows.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  // AccessibleDialog handles body-scroll lock, focus-move-in, Tab trapping,
  // Escape, backdrop-click, and focus-return — no useEffect needed here.

  return (
    <AccessibleDialog labelId={headingId} onClose={onClose}>
      {/*
       * AccessibleDialog renders the panel shell (role=dialog, aria-modal,
       * aria-labelledby, max-h, rounded, shadow). The children below are the
       * scrollable header + body + footer that go inside it.
       */}
      {/* Modal header */}
        <div className="flex items-center justify-between border-b border-[#eee9e4] px-6 py-5">
          <div className="flex max-w-[620px] flex-col gap-1">
            <p className="text-[10px] font-extrabold uppercase text-bloom-pink">
              Catalog operations
            </p>
            <h2 id={headingId} className="text-[24px] font-semibold text-bloom-ink">
              Add product
            </h2>
            <p className="text-[13px] text-bloom-muted">
              Create a new product listing and prepare it for review,
              supplier verification, and marketplace publication.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-bloom-border bg-white text-bloom-ink transition-colors hover:bg-bloom-cream"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal body — the only scrollable region in this dialog */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
          {/* Product basics */}
          <section className="flex w-full flex-col gap-4 rounded-[14px] border border-[#eee9e4] bg-bloom-card p-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-[16px] font-bold text-bloom-ink">Product basics</h3>
              <p className="text-[12px] text-bloom-muted">
                Capture the core listing details that buyers and trade teams will review first.
              </p>
            </div>

            <div className="flex w-full gap-3">
              <TextField
                label="Product name *"
                value={name}
                onChange={setName}
                placeholder="e.g. Organic Turmeric Fingers · Export Grade"
              />
              <SelectField
                label="Category"
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Select category"
                options={categoryOptions}
              />
            </div>

            {/* Product images */}
            <div className="flex w-full flex-col gap-2">
              <label className="text-[11px] font-bold text-bloom-ink">Product images</label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFilesSelected(e.dataTransfer.files);
                }}
                className={`flex w-full items-center gap-3 rounded-[10px] border p-3 transition-colors ${
                  isDragging
                    ? "border-bloom-pink bg-[#fbeaf0]/40 ring-2 ring-bloom-pink/20"
                    : "border-bloom-border bg-white"
                }`}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[#fbeaf0]">
                  <svg aria-hidden viewBox="0 0 24 24" className="size-4 text-bloom-pink" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <p className="text-[13px] font-semibold text-bloom-ink">
                    Upload product images
                  </p>
                  <p className="text-[11px] text-bloom-muted">
                    JPG, PNG, or WebP up to 5MB. Drag &amp; drop or click upload.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={Boolean(uploadProgress)}
                  className="shrink-0 rounded-[8px] bg-bloom-pink px-3 py-2 text-[11px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Upload
                </button>
              </div>

              {imageError ? (
                <p className="text-[11px] font-semibold text-red-600">{imageError}</p>
              ) : null}

              {selectedImages.length > 0 ? (
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {selectedImages.map((img, idx) => (
                    <div
                      key={img.id}
                      className="group relative flex items-center gap-2 rounded-[8px] border border-bloom-border bg-white p-1.5 shadow-sm"
                    >
                      <Image
                        src={img.previewUrl}
                        alt={img.file.name}
                        width={44}
                        height={44}
                        className="size-11 shrink-0 rounded-[6px] object-cover"
                        // blob: URLs are local object URLs — they can't go through
                        // the Next.js image optimizer, so unoptimized is required.
                        unoptimized
                      />
                      <div className="flex flex-col pr-6">
                        <span className="max-w-[120px] truncate text-[11px] font-semibold text-bloom-ink">
                          {img.file.name}
                        </span>
                        <span className="text-[10px] text-bloom-muted">
                          {(img.file.size / 1024).toFixed(0)} KB {idx === 0 ? "· Primary" : ""}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        disabled={Boolean(uploadProgress)}
                        title="Remove image"
                        className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-[#f4f1ee] text-[12px] font-bold text-bloom-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex w-full gap-3">
              <TextField
                label="Short description"
                value={shortDescription}
                onChange={setShortDescription}
                placeholder="Brief summary for search and catalog cards"
              />
              <TextField
                label="Full product details"
                value={fullDetails}
                onChange={setFullDetails}
                placeholder="Add origin, certifications, and key features (not saved yet — no long-description field exists)"
              />
            </div>
          </section>

          {/* Trade & logistics */}
          <section className="flex w-full flex-col gap-4 rounded-[14px] border border-[#eee9e4] bg-bloom-card p-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-[16px] font-bold text-bloom-ink">Trade &amp; logistics</h3>
              <p className="text-[12px] text-bloom-muted">
                Define the commercial rules, shipping setup, and compliance details for this listing.
              </p>
            </div>

            <div className="flex w-full gap-3">
              <TextField
                label="Quantity tiers"
                value={quantityTiers}
                onChange={setQuantityTiers}
                placeholder="e.g. 100–500 kg, 500 kg+ (not saved yet)"
              />
              <TextField
                label="MOQ"
                value={moq}
                onChange={setMoq}
                placeholder="Minimum order quantity"
                suffix="kg"
                type="number"
              />
            </div>

            <div className="flex w-full gap-3">
              <TextField
                label="HS code"
                value={hsCode}
                onChange={setHsCode}
                placeholder="Enter HS code"
              />
              <SelectField
                label="Export eligibility"
                value={exportEligibility}
                onChange={setExportEligibility}
                placeholder="Select eligibility"
                options={EXPORT_ELIGIBILITY_OPTIONS}
              />
            </div>

            <div className="flex w-full gap-3">
              <SelectField
                label="Origin country"
                value={sourceCountryId}
                onChange={setSourceCountryId}
                placeholder="Select origin country"
                options={countryOptions}
              />
              <SelectField
                label="Shipping country"
                value={shippingCountryId}
                onChange={setShippingCountryId}
                placeholder="Select destination country"
                options={countryOptions}
              />
            </div>

            <div className="flex w-full gap-3">
              <TextField
                label="Delivery estimate"
                value={deliveryEstimate}
                onChange={setDeliveryEstimate}
                placeholder="e.g. 10–15 days"
              />
              <TextField
                label="Expiry"
                value={expiryMonths}
                onChange={setExpiryMonths}
                placeholder="e.g. 24"
                suffix="months"
                type="number"
              />
            </div>

            {/* Add extra details — visual only, see component doc comment */}
            <div className="flex w-full flex-col gap-2">
              <div className="flex flex-col gap-0.5">
                <p className="text-[11px] font-bold text-bloom-ink">Add extra details</p>
                <p className="text-[11px] text-bloom-muted">
                  Add simple notes buyers should know, like certifications, packaging, or seasonal notes.
                  Not saved yet — there&apos;s no catalog field for custom attributes.
                </p>
              </div>

              {extraDetails.map((row) => (
                <div key={row.id} className="flex w-full flex-col gap-2">
                  <div className="flex w-full gap-3">
                    <TextField
                      label="Detail label"
                      value={row.label}
                      onChange={(value) => updateDetailRow(row.id, { label: value })}
                      placeholder="e.g. MOQ"
                    />
                    <div className="flex w-[220px] flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-bloom-ink">Value type</label>
                      <div className="flex gap-2">
                        {(["Text", "Number", "Color"] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => updateDetailRow(row.id, { valueType: type })}
                            className={`rounded-full border px-3 py-2 text-[11px] font-bold transition-colors ${
                              row.valueType === type
                                ? "border-bloom-pink bg-[#fbeaf0] text-bloom-pink"
                                : "border-bloom-border bg-white text-bloom-muted"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex w-full gap-3">
                    <div className="flex flex-1 flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-bloom-ink">Value</label>
                      <div className="flex h-10 items-center justify-between rounded-[10px] border border-bloom-border bg-white px-3">
                        <input
                          value={row.value}
                          onChange={(e) => updateDetailRow(row.id, { value: e.target.value })}
                          placeholder="100 kg"
                          className="min-w-0 flex-1 bg-transparent text-[13px] text-bloom-ink outline-none placeholder:text-[#a6a2a4]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setExtraDetails((rows) => rows.filter((r) => r.id !== row.id))
                          }
                          aria-label="Remove detail"
                          className="flex size-5 shrink-0 items-center justify-center rounded-[6px] bg-[#f4f1ee] text-bloom-muted"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="w-[220px]" />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setExtraDetails((rows) => [...rows, emptyDetailRow()])}
                className="flex h-10 w-full items-center gap-2 rounded-[10px] border border-bloom-border bg-white px-3 text-[13px] font-semibold text-bloom-ink transition-colors hover:bg-bloom-cream"
              >
                <PlusIcon className="size-4" />
                Add another detail
              </button>
            </div>
          </section>

          {/* Shipping & pricing */}
          <section className="flex w-full flex-col gap-4 rounded-[14px] border border-[#eee9e4] bg-bloom-card p-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-[16px] font-bold text-bloom-ink">Shipping &amp; pricing</h3>
              <p className="text-[12px] text-bloom-muted">
                Connect the supplier and confirm pricing readiness.
              </p>
            </div>

            <SelectField
              label="Supplier *"
              value={vendorId}
              onChange={setVendorId}
              placeholder="Select verified supplier"
              options={vendorOptions}
            />

            <TextField
              label="Product price"
              value={price}
              onChange={setPrice}
              placeholder="$1,250"
              suffix="USD"
              type="number"
            />

            <div className="flex w-full flex-col gap-2.5">
              <p className="text-[11px] font-bold text-bloom-ink">Cost breakdown</p>
              <div className="flex w-full flex-col gap-2 rounded-[10px] border border-bloom-border bg-white p-3">
                <div className="flex w-full gap-3">
                  <TextField
                    label="Shipping estimate"
                    value={shippingEstimate}
                    onChange={setShippingEstimate}
                    placeholder="Enter shipping estimate"
                    suffix="USD"
                    type="number"
                  />
                  <TextField
                    label="Duties estimate"
                    value={dutiesEstimate}
                    onChange={setDutiesEstimate}
                    placeholder="Enter duties estimate"
                    suffix="USD"
                    type="number"
                  />
                </div>
                <TextField
                  label="Taxes"
                  value={taxesEstimate}
                  onChange={setTaxesEstimate}
                  placeholder="Enter taxes"
                  suffix="USD"
                  type="number"
                />
              </div>
            </div>
          </section>

          {errorMessage ? (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-[10px] border border-red-200 bg-red-50 p-3 text-[12px] font-semibold text-red-700"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0 text-red-600" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          ) : null}
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between border-t border-[#eee9e4] px-6 py-4">
          <p className="text-[12px] text-bloom-muted">
            {uploadProgress ? (
              <span className="font-semibold text-bloom-pink">{uploadProgress}</span>
            ) : (
              "Product name & verified supplier are required."
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isCreating || Boolean(uploadProgress)}
              onClick={onClose}
              className="flex h-10 items-center rounded-[10px] border border-bloom-border bg-white px-4 text-[13px] font-semibold text-bloom-ink transition-colors hover:bg-bloom-cream disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isCreating || Boolean(uploadProgress) || !name.trim() || !vendorId}
              title={!name.trim() || !vendorId ? "Product name and supplier are required" : undefined}
              onClick={() => handleSubmit("DRAFT")}
              className="flex h-10 items-center rounded-[10px] border border-bloom-pink bg-white px-4 text-[13px] font-bold text-bloom-pink transition-colors hover:bg-[#fbeaf0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating && !uploadProgress ? "Saving…" : "Save as draft"}
            </button>
            <button
              type="button"
              disabled={isCreating || Boolean(uploadProgress) || !name.trim() || !vendorId}
              title={!name.trim() || !vendorId ? "Product name and supplier are required" : undefined}
              onClick={() => handleSubmit("PUBLISHED")}
              className="flex h-10 items-center rounded-[10px] bg-bloom-pink px-4 text-[13px] font-bold text-white shadow-[0px_6px_10px_rgba(53,16,31,0.07)] transition-colors hover:bg-pink-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadProgress ? uploadProgress : isCreating ? "Saving…" : "Publish product"}
            </button>
          </div>
        </div>
    </AccessibleDialog>
  );
}
