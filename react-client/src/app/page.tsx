import { SiteHeader } from "@/components/layout/SiteHeader";
import { AssuranceBar } from "@/components/layout/AssuranceBar";
import { Footer } from "@/components/layout/Footer";
import { PromotionalStories } from "@/components/home/PromotionalStories";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { TrendingProducts } from "@/components/home/TrendingProducts";
import { TradeAndExport } from "@/components/home/TradeAndExport";

/**
 * Looma homepage · Market Bloom.
 * Composes the site header, marketplace content sections and footer.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col bg-cream font-sans">
      <SiteHeader />

      <main className="flex flex-col gap-9 px-7 pb-7 pt-[22px]">
        <PromotionalStories />
        {/* Trust bar sits directly beneath the hero, matching the Figma design */}
        <AssuranceBar />
        <ShopByCategory />
        <TrendingProducts />
        <TradeAndExport />
      </main>

      <section className="flex flex-col bg-white">
        <Footer />
      </section>
    </div>
  );
}
