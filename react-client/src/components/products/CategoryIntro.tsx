import Link from "next/link";
import { routes } from "@/config/routes";

interface CategoryIntroProps {
  categoryName: string;
  /** Real category slug from the API — used for the "All {category}" tab link. `null` when showing all products (no category selected). */
  categorySlug: string | null;
  description: string;
}

/** Breadcrumb trail above the category heading. */
function Breadcrumb({ categoryName }: { categoryName: string }) {
  return (
    <p className="text-[13px] text-ink/50">
      <Link href={routes.home} className="hover:text-ink">
        Home
      </Link>
      {"  /  "}
      <Link href={routes.products} className="hover:text-ink">
        All products
      </Link>
      {"  /  "}
      <span className="text-ink">{categoryName}</span>
    </p>
  );
}

/** Category heading, description and trust cues, matching the Figma design. */
function CategoryHeading({
  categoryName,
  description,
}: Pick<CategoryIntroProps, "categoryName" | "description">) {
  return (
    <div className="flex flex-col items-start gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
      <div className="flex flex-col gap-2 lg:max-w-[720px]">
        <h1 className="text-[28px] leading-[1.15] text-ink sm:text-[34px]">
          {categoryName}
        </h1>
        <p className="text-[15px] leading-[1.45] text-ink/50">{description}</p>
      </div>
      <div className="flex flex-col gap-[6px] whitespace-nowrap text-[13px] lg:items-end">
        <p className="font-bold text-delivery">✓ Verified independent makers</p>
        <p className="text-ink/50">Global delivery to Rotterdam</p>
      </div>
    </div>
  );
}

/**
 * Single "All {category}" tab for the active category, linking back to this
 * same filtered listing via the category's real slug. The backend's
 * category model is currently flat (no subcategory hierarchy), so there is
 * no real data for a subcategory-tab row yet — this renders only the one
 * tab the API can actually back, rather than a row of fabricated
 * subcategory names.
 */
function CategoryTab({
  categoryName,
  categorySlug,
}: {
  categoryName: string;
  categorySlug: string;
}) {
  return (
    <div className="flex w-full flex-wrap gap-[10px]">
      <Link
        href={routes.category(categorySlug)}
        className="flex h-11 flex-1 items-center justify-center whitespace-nowrap rounded-[10px] border border-pink bg-pink px-4 text-[13px] font-bold text-white"
      >
        All {categoryName}
      </Link>
    </div>
  );
}

/** Category introduction: breadcrumb, heading and category tab (omitted entirely when no category is selected). */
export function CategoryIntro({ categoryName, categorySlug, description }: CategoryIntroProps) {
  return (
    <div className="flex w-full flex-col gap-[18px]">
      <Breadcrumb categoryName={categoryName} />
      <CategoryHeading categoryName={categoryName} description={description} />
      {categorySlug ? (
        <CategoryTab categoryName={categoryName} categorySlug={categorySlug} />
      ) : null}
    </div>
  );
}
