import Link from "next/link";
import Panel from "@/components/ui/Panel";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
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
          <Panel key={product.id} bodyClassName="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-center h-[96px] bg-paper rounded text-[36px]" aria-hidden="true">
              {product.emoji}
            </div>

            <div>
              <p className="font-heading font-semibold text-ink text-[14px]">
                {product.name}
              </p>
              <p className="font-body text-text text-[13px] mt-1">{product.price}</p>
              <p className="font-body text-text-dim text-[12px]">{product.moq}</p>
            </div>

            <div className="flex items-center gap-1">
              <p className="font-body text-text-dim text-[12px]">{product.supplierName}</p>
              {product.supplierVerified && <Badge tone="teal">{"\u2713"}</Badge>}
            </div>

            <div className="mt-1">
              <Link href={`/products/${product.id}`}>
                <Button variant="accent" size="sm" className="w-full">
                  View
                </Button>
              </Link>
            </div>
          </Panel>
        ))}
      </div>
    </section>
  );
}
