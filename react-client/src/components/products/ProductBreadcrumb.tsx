import Link from "next/link";
import { routes } from "@/config/routes";

interface ProductBreadcrumbProps {
  categoryName?: string | null;
  categorySlug?: string | null;
  productName: string;
}

/**
 * Breadcrumb for the product detail page: Home → Category → Product name.
 * Category is a link to the filtered listing (routes.category) when the
 * product has one; omitted entirely when the product has no category
 * (categoryId is nullable on the backend).
 */
export function ProductBreadcrumb({
  categoryName,
  categorySlug,
  productName,
}: ProductBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13px] text-ink/50">
      <Link href={routes.home} className="hover:text-ink">
        Home
      </Link>
      {"  /  "}
      {categoryName && categorySlug ? (
        <>
          <Link href={routes.category(categorySlug)} className="hover:text-ink">
            {categoryName}
          </Link>
          {"  /  "}
        </>
      ) : null}
      <span className="text-ink" aria-current="page">
        {productName}
      </span>
    </nav>
  );
}
