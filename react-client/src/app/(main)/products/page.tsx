import { AssuranceBar } from "@/components/layout/AssuranceBar";
import { CategoryIntro } from "@/components/products/CategoryIntro";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductsPagination } from "@/components/products/ProductsPagination";
import { ProductsToolbar } from "@/components/products/ProductsToolbar";
import { TradeAndExport } from "@/components/home/TradeAndExport";
import { HOME_LIVING_PRODUCTS } from "@/data/products";

const CATEGORY_NAME = "Home & Living";
const CATEGORY_DESCRIPTION =
  "Thoughtfully made pieces for everyday living, from independent makers around the world.";
const TOTAL_RESULTS = 186;
const CATEGORY_TOTAL_RESULTS = 1248;
const PAGE_SIZE = 12;
const CURRENT_PAGE = 1;
const TOTAL_PAGES = 16;

/**
 * Product listing page for a category (currently "Home & Living", matching
 * the Figma "Product list" screen). Header/footer come from the `(main)`
 * route group layout.
 */
export default function ProductsPage() {
  return (
    <main className="flex flex-col gap-7 px-7 pb-9 pt-[22px]">
      <CategoryIntro
        categoryName={CATEGORY_NAME}
        description={CATEGORY_DESCRIPTION}
      />

      <div className="flex w-full flex-col gap-6 lg:flex-row">
        <ProductFilters categoryName={CATEGORY_NAME} />

        <div className="flex min-w-0 flex-1 flex-col gap-[18px]">
          <ProductsToolbar
            resultCount={TOTAL_RESULTS}
            categoryResultCount={CATEGORY_TOTAL_RESULTS}
            categoryName={CATEGORY_NAME}
          />
          <ProductGrid products={HOME_LIVING_PRODUCTS} />
          <ProductsPagination
            currentPage={CURRENT_PAGE}
            totalPages={TOTAL_PAGES}
            pageSize={PAGE_SIZE}
            totalResults={TOTAL_RESULTS}
          />
        </div>
      </div>

      <TradeAndExport />
      <AssuranceBar />
    </main>
  );
}
