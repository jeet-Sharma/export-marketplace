"use client";

import { useId, useState } from "react";
import { PlusIcon } from "../components/icons";
import { SelectField, TextField } from "./AddProductFormFields";
import { useCreateProductMutation } from "./productsApi";
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

type AddProductModalProps = {
  onClose: () => void;
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

/**
 * "Add product" modal, matching the Figma design (node 1:3817 / modal
 * 1:4180) field-for-field. Submits via POST /admin/products
 * (CreateProductDto) with either status=DRAFT ("Save as draft") or
 * status=PUBLISHED ("Publish product").
 *
 * Four Figma elements have no full backing feature yet and are called out
 * rather than silently wired to fake behavior:
 * - "Product images" upload: there's no image-upload endpoint wired into
 *   this form (the real upload flow is presigned-URL based, see
 *   ProductsService.requestImageUploadUrl/addImage, a multi-step process
 *   this single-submit form doesn't orchestrate yet). The upload control
 *   and thumbnail grid render per the design but don't persist a file.
 * - "Short description": saved to CreateProductDto.description — the only
 *   free-text description field the backend exposes at this endpoint.
 * - "Full product details": the backend has no separate long-description
 *   field, so this input is captured but not sent. The placeholder makes
 *   this explicit. A future richText/longDescription column on the Product
 *   entity is the correct next step.
 * - "Quantity tiers": the Figma field is a single free-text description
 *   ("100–500 kg, 500 kg+"), but the backend's real tier concept
 *   (CreateProductDto.priceTiers) is a structured array of
 *   {minQuantity, maxQuantity, price, ...} rows, not a parseable string.
 *   Rather than guessing a parse, this field is captured but not sent —
 *   a real tier builder (one row per tier, like Figma's price-tier table
 *   elsewhere in the app) is the correct next step, not a text field.
 * - "Add extra details" (custom label/value rows): the Product entity has
 *   no free-form attributes column, so these rows are visual-only and are
 *   not included in the POST body. Flagged in the row list below rather
 *   than removed, since the task asked for exact visual fidelity.
 */
export function AddProductModal({ onClose }: AddProductModalProps) {
  const headingId = useId();

  const { data: categories } = useGetCategoryOptionsQuery();
  const { data: countries } = useGetCountryOptionsQuery();
  const { data: vendorsResult } = useGetAdminVendorsQuery();
  const [createProduct, { isLoading, error }] = useCreateProductMutation();

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDetails, setFullDetails] = useState("");

  const [quantityTiers, setQuantityTiers] = useState("");
  const [moq, setMoq] = useState("");
  const [hsCode, setHsCode] = useState("");
  const [exportEligibility, setExportEligibility] = useState("");
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
    label: vendor.displayName ?? vendor.companyName,
  }));
  const categoryOptions = (categories ?? []).map((category) => ({
    value: category.id,
    label: category.name,
  }));
  const countryOptions = (countries ?? []).map((country) => ({
    value: country.id,
    label: country.name,
  }));

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
      unit: moq ? "kg" : undefined,
      moq: moq && Number.isFinite(parsedMoq) ? parsedMoq : undefined,
      hsCode: hsCode.trim() || undefined,
      sourceCountryId: undefined,
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

  async function handleSubmit(status: "DRAFT" | "PUBLISHED") {
    if (!name.trim() || !vendorId) {
      return;
    }
    try {
      await createProduct(buildPayload(status)).unwrap();
      onClose();
    } catch {
      // Error state is surfaced inline via the `error` field below; swallow
      // here so an unhandled rejection doesn't bubble past this handler.
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
                label="Product name"
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

            {/* Product images — visual only, see component doc comment */}
            <div className="flex w-full flex-col gap-1.5">
              <label className="text-[11px] font-bold text-bloom-ink">Product images</label>
              <div className="flex w-full items-center gap-3 rounded-[10px] border border-bloom-border bg-white p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] bg-[#fbeaf0]">
                  <svg aria-hidden viewBox="0 0 24 24" className="size-4 text-bloom-pink" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <p className="text-[13px] font-semibold text-bloom-ink">Upload product images</p>
                  <p className="text-[11px] text-bloom-muted">Add hero, detail, and packaging shots for buyer review.</p>
                </div>
                <button
                  type="button"
                  disabled
                  title="Image upload isn't wired into this form yet"
                  className="shrink-0 cursor-not-allowed rounded-[8px] bg-bloom-pink px-3 py-2 text-[11px] font-bold text-white opacity-60"
                >
                  Upload
                </button>
              </div>
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
                label="Shipping country"
                value={shippingCountryId}
                onChange={setShippingCountryId}
                placeholder="Select destination country"
                options={countryOptions}
              />
              <TextField
                label="Delivery estimate"
                value={deliveryEstimate}
                onChange={setDeliveryEstimate}
                placeholder="e.g. 10–15 days"
              />
            </div>

            <div className="flex w-full gap-3">
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
              label="Supplier"
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

          {error ? (
            <p className="text-[12px] text-error">
              Could not save this product. Check the required fields (name and supplier) and try again.
            </p>
          ) : null}
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between border-t border-[#eee9e4] px-6 py-4">
          <p className="text-[12px] text-bloom-muted">
            Drafts are saved privately and can be published later.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 items-center rounded-[10px] border border-bloom-border bg-white px-4 text-[13px] font-semibold text-bloom-ink transition-colors hover:bg-bloom-cream"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isLoading || !name.trim() || !vendorId}
              onClick={() => handleSubmit("DRAFT")}
              className="flex h-10 items-center rounded-[10px] border border-bloom-pink bg-white px-4 text-[13px] font-bold text-bloom-pink transition-colors hover:bg-[#fbeaf0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save as draft
            </button>
            <button
              type="button"
              disabled={isLoading || !name.trim() || !vendorId}
              onClick={() => handleSubmit("PUBLISHED")}
              className="flex h-10 items-center rounded-[10px] bg-bloom-pink px-4 text-[13px] font-bold text-white shadow-[0px_6px_10px_rgba(53,16,31,0.07)] transition-colors hover:bg-pink-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Saving…" : "Publish product"}
            </button>
          </div>
        </div>
    </AccessibleDialog>
  );
}
