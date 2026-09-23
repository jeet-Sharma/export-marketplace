import { productDetails } from "@/data/public";

// Product data-access layer. Pages call getProductById()/getAllProductIds()
// instead of touching `productDetails` directly, so callers don't need to
// know (or care) that the data currently comes from a hardcoded object
// literal. When product data moves to a real API/database, only this file
// changes — getProductById becomes an async fetch/query, its return type
// stays Product | undefined, and every caller keeps working unmodified.

export interface PriceTier {
  range: string;
  price: string;
}

export interface CountryLogisticsInfo {
  delivery: string;
  duties: string;
}

export interface ProductSupplier {
  name: string;
  initials: string;
  country: string;
  verified: boolean;
  responseTime: string;
}

export interface ProductShipping {
  readyToShip: string;
  shippedFrom: string;
  incoterms: string;
}

export interface Product {
  id: string;
  name: string;
  emoji: string;
  gallery: string[];
  description: string;
  priceTiers: PriceTier[];
  moq: string;
  hsCode: string;
  exportEligibility: string;
  countryRestriction: string;
  expiry: string;
  countryLogistics: Record<string, CountryLogisticsInfo>;
  supplier: ProductSupplier;
  shipping: ProductShipping;
}

// productDetails is typed as Record<string, Product> here (rather than
// relying on the object literal's inferred closed key union) specifically
// so lookups by an arbitrary route param compile without an index-signature
// error, while still returning `undefined` for unknown ids at runtime.
const productsById: Record<string, Product> = productDetails;

/** Returns the product for an id, or undefined if it doesn't exist. */
export function getProductById(productId: string): Product | undefined {
  return productsById[productId];
}

/** All known product ids, used for static param generation. */
export function getAllProductIds(): string[] {
  return Object.keys(productsById);
}
