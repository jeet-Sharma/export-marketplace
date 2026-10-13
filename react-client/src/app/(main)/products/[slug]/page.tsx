import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
 * Fetches the product server-side for both the page render and its
 * metadata. Returns `null` on any failure — the backend returns a plain
 * 404 for a nonexistent slug AND for a DRAFT/unpublished product (by
 * design, so draft existence is never leaked publicly) — both cases are
 * handled identically here via `notFound()`.
 */
async function fetchProduct(slug: string): Promise<ApiProductDetail | null> {
  try {
    return await getProductBySlug(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return { title: "Product not found · Looma" };
  }

  const price = formatPrice(product.price, product.currencyCode);
  return {
    title: `${product.name} · Looma`,
    description: product.description ?? `${product.name} — ${price} on Looma, the shared market for independent goods.`,
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
