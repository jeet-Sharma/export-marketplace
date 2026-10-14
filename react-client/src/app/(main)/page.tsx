import { PromotionalStories } from "@/components/home/PromotionalStories";
import { AssuranceBar } from "@/components/layout/AssuranceBar";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { TrendingProducts } from "@/components/home/TrendingProducts";
import { TradeAndExport } from "@/components/home/TradeAndExport";

/**
 * Looma homepage · Market Bloom.
 * Composes the marketplace content sections; header/footer come from the
 * `(main)` route group layout.
 */
export default function HomePage() {
  return (
    <main className="flex flex-col gap-9 px-7 pb-7 pt-[22px]">
      <PromotionalStories />
      {/* Trust bar sits directly beneath the hero, matching the Figma design */}
      <AssuranceBar />
      <ShopByCategory />
      <TrendingProducts />
      <TradeAndExport />
    </main>
  );
}
