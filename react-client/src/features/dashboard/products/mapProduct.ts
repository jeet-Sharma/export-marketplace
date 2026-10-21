import type { ProductRow, PublicationStatus } from "./productData";
import type { ApiProduct } from "./productTypes";

/**
 * Format a money value for display without ever doing float math on it.
 * Backend `price` is a numeric-as-string (e.g. "1250.0000") paired with a
 * currency code; we trim trailing zeros for display but keep the string as
 * the source of truth (marketplace-domain.md money rule). A price with no
 * currency is meaningless, so both must be present.
 */
function formatPrice(price: string | null, currencyCode: string | null): string {
  if (!price || !currencyCode) {
    return "Price pending";
  }
  // Drop trailing fractional zeros ("1250.0000" -> "1250", "9.5000" -> "9.5")
  // purely as string manipulation — no Number() round-trip.
  const trimmed = price.includes(".")
    ? price.replace(/\.?0+$/, "")
    : price;
  return `${currencyCode} ${trimmed}`;
}

function toPublicationStatus(status: ApiProduct["status"]): PublicationStatus {
  return status === "PUBLISHED" ? "published" : "draft";
}

function buildTradeSetup(product: ApiProduct): string[] {
  const moqPart = product.moq
    ? `MOQ ${product.moq}${product.unit ? ` ${product.unit}` : ""}`
    : "MOQ pending";
  const hsPart = product.hsCode ? `HS ${product.hsCode}` : "HS code —";
  return [`${moqPart} · ${hsPart}`];
}

/**
 * Map a backend product to the table row view model.
 * Joins real category and vendor display names returned by the API.
 */
export function mapApiProductToRow(product: ApiProduct): ProductRow {
  const isPublished = product.status === "PUBLISHED";
  const categoryName = product.category?.name ?? "Category —";
  const vendorName =
    product.vendor?.companyName ??
    product.vendor?.displayName ??
    "Vendor —";
  const originName =
    product.sourceCountry?.name ??
    product.sourceCountry?.iso2Code ??
    "";
  const imageUrl =
    product.images?.[0]?.url ?? "/products/placeholder.svg";

  return {
    id: product.id,
    name: product.name,
    image: imageUrl,
    category: categoryName,
    origin: originName,
    tradeSetup: buildTradeSetup(product),
    price: formatPrice(product.price, product.currencyCode),
    supplier: vendorName,
    verification: "pending",
    publication: toPublicationStatus(product.status),
    exportEligibility: product.exportEligibility
      ? `Export eligibility: ${product.exportEligibility}`
      : "Export eligibility: Pending",
    note: isPublished ? "Visible to buyers" : undefined,
    rawStatus: product.status,
  };
}
