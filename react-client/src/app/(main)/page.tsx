import { PromotionalStories } from "@/components/home/PromotionalStories";
import { AssuranceBar } from "@/components/layout/AssuranceBar";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { TrendingProducts } from "@/components/home/TrendingProducts";
import { TradeAndExport } from "@/components/home/TradeAndExport";

/**
 * Export Marketplace homepage · Market Bloom.
 * Composes the marketplace content sections; header/footer come from the
 * `(main)` route group layout.
 */
export default function HomePage() {
  return (
    <main className="flex flex-col gap-5 px-7 pb-5 pt-4">
      <PromotionalStories />
      <AssuranceBar />
      <ShopByCategory />
      <TrendingProducts />
      <TradeAndExport />
    </main>
  );
}
