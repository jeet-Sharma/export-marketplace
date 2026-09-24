import { notFound } from "next/navigation";
import ProductDetailPage from "@/components/public/product-detail/ProductDetailPage";
import { getAllProductIds, getProductById } from "@/lib/products";

export function generateStaticParams() {
  return getAllProductIds().map((productId) => ({ productId }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = getProductById(productId);

  if (!product) {
    notFound();
  }

  return <ProductDetailPage product={product} />;
}
