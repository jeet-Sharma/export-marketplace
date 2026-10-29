import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAxiosError } from "axios";
import { ProductDetailView } from "@/components/products/ProductDetailView";
import { getProductBySlug, getProducts } from "@/features/products/api/products.api";
import { formatPrice } from "@/features/products/api/products.mapper";
import type { ApiProductDetail, ApiProductListItem } from "@/features/products/types/product-api.types";

const RELATED_PRODUCTS_LIMIT = 4;

/**
 * Fetches up to RELATED_PRODUCTS_LIMIT other published products from the
 * same category, excluding the current product. Returns an empty array
 * (not a thrown error) on any failure — related products are a secondary,
 * non-critical section; a failure here should never block the main
 * product detail from rendering.
 */
async function fetchRelatedProducts(
  categoryId: string | null,
  excludeProductId: string,
): Promise<ApiProductListItem[]> {
  if (!categoryId) {
    return [];
  }
  try {
    const { items } = await getProducts({
      categoryId,
      pageSize: RELATED_PRODUCTS_LIMIT + 1,
      sort: "newest",
    });
    return items.filter((item) => item.id !== excludeProductId).slice(0, RELATED_PRODUCTS_LIMIT);
  } catch {
    return [];
  }
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Fetches the product server-side for both the page render and its metadata.
 * Wrapped in React `cache` so generateMetadata and the page component share a
 * single in-flight/resolved request per render pass instead of executing twice.
 *
 * Returns `null` ONLY on a genuine 404 — the backend returns 404 for both
 * a nonexistent slug and a DRAFT/unpublished product (by design, so draft
 * existence is never leaked publicly) and both are handled via `notFound()`.
 *
 * Any other error (connection failure, 5xx, timeout, etc.) is logged and
 * rethrown so Next.js follows its error-boundary path rather than silently
 * serving a "not found" page for a product that actually exists.
 */
const fetchProduct = cache(async (slug: string): Promise<ApiProductDetail | null> => {
  try {
    return await getProductBySlug(slug);
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      // Genuine "not found" (nonexistent slug or unpublished product) —
      // callers render notFound(), not an error page.
      return null;
    }
    // Transient / server error — log it so it's visible in server logs,
    // then rethrow so Next.js hits the nearest error boundary instead of
    // showing a misleading "product not found" page.
    console.error(
      `[fetchProduct] Unexpected error fetching product "${slug}":`,
      err,
    );
    throw err;
  }
});

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return { title: "Product not found · Export Marketplace" };
  }

  const price = formatPrice(product.price, product.currencyCode);
  return {
    title: `${product.name} · Export Marketplace`,
    description: product.description ?? `${product.name} — ${price} on Export Marketplace, the shared market for independent goods.`,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

/**
 * Product detail page — Server Component, fetched server-side via
 * GET /products/:slug (section 12.2). Only PUBLISHED products are ever
 * returned by that endpoint; a DRAFT product or a nonexistent slug both
 * reach `notFound()` identically (see fetchProduct's comment) — this is
 * the frontend half of the "never expose draft product information
 * through public UI" requirement. Backend enforcement (the service's
 * status filter) is the actual boundary; this is a UI-level safeguard on
 * top of it, not a substitute for it.
 */
export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await fetchRelatedProducts(product.category?.id ?? null, product.id);

  return <ProductDetailView product={product} relatedProducts={relatedProducts} />;
}
