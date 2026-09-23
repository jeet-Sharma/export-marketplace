import { notFound } from "next/navigation";
import ProductDetailPage from "@/components/public/product-detail/ProductDetailPage";
import { productDetails } from "@/data/public";

export function generateStaticParams() {
  return Object.keys(productDetails).map((productId) => ({ productId }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = productDetails[productId];

  if (!product) {
    notFound();
  }

  return <ProductDetailPage product={product} />;
}
