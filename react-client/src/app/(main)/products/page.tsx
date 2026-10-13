import { Suspense } from "react";
import { ProductsPageContent } from "./ProductsPageContent";

/**
 * Product listing page for a category, fetched live from GET /categories
 * and GET /products. Header/footer come from the `(main)` route group
 * layout. Wrapped in Suspense because ProductsPageContent reads the URL via
 * useSearchParams(), which Next.js requires a Suspense boundary for.
 */
export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsPageContent />
    </Suspense>
  );
}
