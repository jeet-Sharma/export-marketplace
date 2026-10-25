import Link from "next/link";
import { routes } from "@/config/routes";

export interface CategoryChip {
  id: string;
  name: string;
  slug: string;
}

interface CategoryIntroProps {
  categoryName: string;
  /** Real category slug from the API. `null` when showing all products. */
  categorySlug: string | null;
  description: string;
  /** Every active category. The one matching `categorySlug` is highlighted. */
  categories: CategoryChip[];
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
 * Every category, on one row. The category in the URL is filled pink;
 * the others stay outlined. Choosing another chip loads that category's
 * products and moves the highlight.
 */
function CategoryTabs({
  categories,
  categorySlug,
}: {
  categories: CategoryChip[];
  categorySlug: string | null;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="flex w-full flex-wrap gap-[10px]">
      {categories.map((category) => {
        const selected = category.slug === categorySlug;
        return (
          <Link
            key={category.id}
            href={routes.category(category.slug)}
            aria-current={selected ? "page" : undefined}
            className={`flex h-11 min-w-[140px] flex-1 items-center justify-center whitespace-nowrap rounded-[10px] border border-pink px-4 text-[13px] ${
              selected
                ? "bg-pink font-bold text-white"
                : "bg-white text-ink"
            }`}
          >
            {selected ? `All ${category.name}` : category.name}
          </Link>
        );
      })}
    </div>
  );
}

/** Category introduction: breadcrumb, heading, and every category as a selectable chip. */
export function CategoryIntro({
  categoryName,
  categorySlug,
  description,
  categories,
}: CategoryIntroProps) {
  return (
    <div className="flex w-full flex-col gap-[18px]">
      <Breadcrumb categoryName={categoryName} />
      <CategoryHeading categoryName={categoryName} description={description} />
      <CategoryTabs categories={categories} categorySlug={categorySlug} />
    </div>
  );
}
