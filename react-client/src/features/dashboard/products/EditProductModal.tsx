"use client";

import { useState } from "react";
import { useCategoriesQuery } from "@/features/categories/api/categories.queries";
import { useCountriesQuery } from "@/features/countries/api/countries.queries";
import {
  useGetAdminVendorsQuery,
  useUpdateAdminProductMutation,
} from "./productsApi";
import type { ApiProduct, UpdateProductInput } from "./productTypes";

type EditProductModalProps = {
  isOpen: boolean;
  product: ApiProduct;
  onClose: () => void;
};

export function EditProductModal({
  isOpen,
  product,
  onClose,
}: EditProductModalProps) {
  const [updateProduct, { isLoading }] = useUpdateAdminProductMutation();
  const { data: categories } = useCategoriesQuery();
  const { data: vendorsData } = useGetAdminVendorsQuery();
  const { data: countries } = useCountriesQuery();

  const vendors = vendorsData?.items ?? [];

  const [name, setName] = useState(product.name);
  const [vendorId, setVendorId] = useState(product.vendorId);
  const [categoryId, setCategoryId] = useState(product.categoryId ?? "");
  const [price, setPrice] = useState(product.price ?? "");
  const [currencyCode, setCurrencyCode] = useState(product.currencyCode ?? "USD");
  const [unit, setUnit] = useState(product.unit ?? "kg");
  const [moq, setMoq] = useState(product.moq ?? "");
  const [hsCode, setHsCode] = useState(product.hsCode ?? "");
  const [sourceCountryId, setSourceCountryId] = useState(product.sourceCountryId ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Product name is required.");
      return;
    }

    if (!vendorId) {
      setErrorMsg("Please select a vendor.");
      return;
    }

    const data: UpdateProductInput = {
      name: name.trim(),
      vendorId,
      // Empty optional fields are sent as null so PATCH clears them.
      // Omitting the field would leave the previously saved value in place.
      currencyCode: currencyCode || null,
      unit: unit.trim() || null,
      description: description.trim() || null,
      categoryId: categoryId || null,
      sourceCountryId: sourceCountryId || null,
      hsCode: hsCode.trim() || null,
      price: price.trim() === "" ? null : Number(price),
      moq: moq.trim() === "" ? null : Number(moq),
    };

    try {
      await updateProduct({ id: product.id, data }).unwrap();
      onClose();
    } catch (err: unknown) {
      let msg = "Failed to update product.";
      if (typeof err === "object" && err !== null && "data" in err) {
        const d = (err as { data?: { message?: string | string[] } }).data;
        if (d?.message) {
          msg = Array.isArray(d.message) ? d.message.join(", ") : d.message;
        }
      }
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-[620px] flex-col overflow-hidden rounded-[20px] border border-bloom-border bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#eee9e4] px-6 py-4">
          <div>
            <h2 className="text-[18px] font-bold text-bloom-ink">Edit Product</h2>
            <p className="text-[12px] text-bloom-muted">
              Update listing details for {product.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-bloom-muted hover:bg-bloom-cream hover:text-bloom-ink"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto p-6 gap-4">
          {errorMsg && (
            <div className="rounded-[10px] border border-red-200 bg-red-50 p-3 text-[12px] text-red-700">
              {errorMsg}
            </div>
          )}

          {/* Name & Vendor */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-bloom-ink">
              Product Name <span className="text-bloom-pink">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-[10px] border border-bloom-border px-3 text-[13px] text-bloom-ink outline-none focus:border-bloom-pink"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-bloom-ink">
                Vendor / Supplier <span className="text-bloom-pink">*</span>
              </label>
              <select
                required
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="h-10 rounded-[10px] border border-bloom-border bg-white px-3 text-[13px] text-bloom-ink outline-none focus:border-bloom-pink"
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.companyName || v.displayName || v.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-bloom-ink">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 rounded-[10px] border border-bloom-border bg-white px-3 text-[13px] text-bloom-ink outline-none focus:border-bloom-pink"
              >
                <option value="">Select Category (Optional)</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price, Currency, Unit, MOQ */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-bloom-ink">Base Price</label>
              <input
                type="number"
                step="any"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="10.50"
                className="h-10 rounded-[10px] border border-bloom-border px-3 text-[13px] text-bloom-ink outline-none focus:border-bloom-pink"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-bloom-ink">Currency</label>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="h-10 rounded-[10px] border border-bloom-border bg-white px-3 text-[13px] text-bloom-ink outline-none focus:border-bloom-pink"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
                <option value="AED">AED</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-bloom-ink">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg, box, piece"
                className="h-10 rounded-[10px] border border-bloom-border px-3 text-[13px] text-bloom-ink outline-none focus:border-bloom-pink"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-bloom-ink">MOQ</label>
              <input
                type="number"
                step="any"
                min="0.0001"
                value={moq}
                onChange={(e) => setMoq(e.target.value)}
                placeholder="100"
                className="h-10 rounded-[10px] border border-bloom-border px-3 text-[13px] text-bloom-ink outline-none focus:border-bloom-pink"
              />
            </div>
          </div>

          {/* HS Code & Source Country */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-bloom-ink">HS Code</label>
              <input
                type="text"
                value={hsCode}
                onChange={(e) => setHsCode(e.target.value)}
                placeholder="0904.11"
                className="h-10 rounded-[10px] border border-bloom-border px-3 text-[13px] text-bloom-ink outline-none focus:border-bloom-pink"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-bloom-ink">Origin Country</label>
              <select
                value={sourceCountryId}
                onChange={(e) => setSourceCountryId(e.target.value)}
                className="h-10 rounded-[10px] border border-bloom-border bg-white px-3 text-[13px] text-bloom-ink outline-none focus:border-bloom-pink"
              >
                <option value="">Select Country</option>
                {countries?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.iso2Code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-bloom-ink">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-[10px] border border-bloom-border p-3 text-[13px] text-bloom-ink outline-none focus:border-bloom-pink"
            />
          </div>

          {/* Actions */}
          <div className="mt-2 flex items-center justify-end gap-3 border-t border-[#eee9e4] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[10px] border border-bloom-border bg-white px-4 text-[13px] font-semibold text-bloom-ink transition-colors hover:bg-bloom-cream"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-10 items-center justify-center rounded-[10px] bg-bloom-pink px-5 text-[13px] font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
