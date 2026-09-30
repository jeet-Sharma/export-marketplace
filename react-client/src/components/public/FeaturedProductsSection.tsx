import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProductSummaryCard from "@/components/shared/ProductSummaryCard";
import { featuredProducts } from "@/data/public";

// Featured products grid with "Buy Now" / "Request Quote" actions, mirroring
// the product-listing-page card spec (image, price, supplier, MOQ).
export default function FeaturedProductsSection() {
  return (
    <section className="w-full px-4 py-10 sm:px-6 bg-panel">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-ink text-[22px]">
          Featured Products
        </h2>
        <Badge tone="teal">{"\u2713"} Trade Assurance</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {featuredProducts.map((product) => (
          <ProductSummaryCard
            key={product.id}
            emoji={product.emoji}
            name={product.name}
            price={product.price}
            moq={product.moq}
            supplierName={product.supplierName}
            supplierVerified={product.supplierVerified}
            actions={
              <div className="mt-1">
                <Link href={`/products/${product.id}`}>
                  <Button variant="accent" size="sm" className="w-full">
                    View
                  </Button>
                </Link>
              </div>
            }
          />
        ))}
      </div>
    </section>
  );
}
