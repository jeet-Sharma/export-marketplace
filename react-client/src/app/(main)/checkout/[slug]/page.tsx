import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isAxiosError } from "axios";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { getProductBySlug } from "@/features/products/api/products.api";
import type { ApiProductDetail } from "@/features/products/types/product-api.types";

interface CheckoutPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Fetches the product server-side, same pattern and 404-handling as
 * `/products/[slug]/page.tsx` (see that file's `fetchProduct` for the
 * reasoning on why only a genuine 404 returns null while any other error
 * rethrows). Kept as its own `cache`-wrapped function here rather than
 * importing the products page's version, since the two routes' modules
 * aren't meant to depend on each other.
 */
const fetchProduct = cache(async (slug: string): Promise<ApiProductDetail | null> => {
  try {
    return await getProductBySlug(slug);
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    console.error(`[checkout fetchProduct] Unexpected error fetching product "${slug}":`, err);
    throw err;
  }
});

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);
  return {
    title: product ? `Checkout · ${product.name} · Export Marketplace` : "Checkout · Export Marketplace",
  };
}

/**
 * Checkout page — UI only, matching the Figma "Complete your order"
 * design (node 1:3165) exactly. There is no `orders`/`checkout`/`payments`
 * module on the backend yet (confirmed against nest-server/src/modules),
 * so this page cannot place a real order: "Place order request" is a
 * disabled placeholder, and every price field reads "Pending confirmed
 * price" — which the Figma design itself already treats as TBD pricing,
 * so that part needs no fabrication. All contact/address/notes fields
 * are plain uncontrolled inputs for layout fidelity; nothing here is
 * persisted or validated server-side.
 *
 * The only real data wired in is the ordered product itself (name,
 * image, origin, delivery estimate, MOQ) via GET /products/:slug — same
 * source of truth as the product detail page, reached via the real
 * "Buy now" link.
 */
export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    notFound();
  }

  return <CheckoutView product={product} />;
}
