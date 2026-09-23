import Link from "next/link";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";
import Panel from "@/components/ui/Panel";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProductGallery from "@/components/public/product-detail/ProductGallery";
import PriceTiers from "@/components/public/product-detail/PriceTiers";
import ComplianceFacts from "@/components/public/product-detail/ComplianceFacts";
import CountryLogistics from "@/components/public/product-detail/CountryLogistics";
import SupplierCard from "@/components/public/product-detail/SupplierCard";
import ShippingInfo from "@/components/public/product-detail/ShippingInfo";
import RfqForm from "@/components/public/product-detail/RfqForm";

// Public product detail page: reached from a homepage/listing "View"
// action. Same header/footer shell and design tokens as the homepage so the
// public site reads as one product.
export default function ProductDetailPage({ product }) {
  const countries = Object.keys(product.countryLogistics ?? {});

  return (
    <div className="flex flex-col min-h-screen bg-paper">
      <PublicHeader />

      <main className="flex-1 w-full px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-4">
          <Link href="/" className="font-body text-text-dim text-[12px] hover:text-saffron">
            {"\u2190"} Back to Home
          </Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: gallery + description + compliance */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <ProductGallery gallery={product.gallery} name={product.name} />

            <Panel bodyClassName="p-4 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <h1 className="font-heading font-bold text-ink text-[24px]">
                  {product.name}
                </h1>
                <Badge tone="teal">{"\u2713"} Trade Assurance</Badge>
              </div>

              <PriceTiers tiers={product.priceTiers} />

              <p className="font-body text-text-dim text-[12px]">MOQ: {product.moq}</p>

              <div>
                <h2 className="font-heading font-semibold text-ink text-[15px] mb-2">
                  Description
                </h2>
                <p className="font-body text-text text-[13px] leading-[1.6]">
                  {product.description}
                </p>
              </div>

              <div>
                <h2 className="font-heading font-semibold text-ink text-[15px] mb-2">
                  Export Compliance
                </h2>
                <ComplianceFacts product={product} />
              </div>

              <div>
                <h2 className="font-heading font-semibold text-ink text-[15px] mb-2">
                  Delivery &amp; Duties
                </h2>
                <CountryLogistics countryLogistics={product.countryLogistics} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="accent" size="md" className="flex-1">
                  Add to Cart / Buy Now
                </Button>
                <Button variant="ghost" size="md" className="flex-1">
                  Request Quote
                </Button>
              </div>
            </Panel>

            <RfqForm countries={countries} productName={product.name} />
          </div>

          {/* Right column: supplier + shipping info */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <SupplierCard supplier={product.supplier} />
            <ShippingInfo shipping={product.shipping} />
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
