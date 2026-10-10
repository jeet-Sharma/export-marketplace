import type { Product } from "@/types/product";
import type { ApiProductListItem } from "../types/product-api.types";

/** Fallback image shown when a product has no primaryImageUrl yet. */
const PLACEHOLDER_IMAGE = "/marketplace/product-1.png";

function formatPrice(price: string | null, currencyCode: string | null): string {
  if (!price) {
    return "Price on request";
  }
  const amount = Number(price);
  const formatted = Number.isFinite(amount) ? amount.toFixed(2) : price;
  const symbol = currencyCode === "USD" ? "$" : `${currencyCode ?? ""} `;
  return `${symbol}${formatted}`;
}

function formatOrigin(item: ApiProductListItem): string {
  return item.sourceCountry?.name ?? item.vendor.displayName ?? item.vendor.companyName;
}

/**
 * Maps a live API catalogue item to the UI-facing Product shape ProductCard
 * renders. Only maps fields the backend actually provides — badge/rating/
 * delivery-copy fields the backend has no concept of yet are intentionally
 * left unset rather than fabricated (see Product's updated optional fields).
 */
export function toProductCardProps(item: ApiProductListItem): Product {
  return {
    image: item.primaryImageUrl ?? PLACEHOLDER_IMAGE,
    origin: formatOrigin(item),
    name: item.name,
    price: formatPrice(item.price, item.currencyCode),
    delivery: item.estimatedDeliveryText
      ? `✓ ${item.estimatedDeliveryText}`
      : undefined,
  };
}
