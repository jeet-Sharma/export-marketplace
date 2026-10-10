import Link from "next/link";
import { routes, toCategorySlug } from "@/config/routes";
import { SUBCATEGORY_TABS } from "@/data/product-filters";

interface CategoryIntroProps {
  categoryName: string;
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
      <Link href={routes.categories} className="hover:text-ink">
        All categories
      </Link>
      {"  /  "}
      <span className="text-ink">{categoryName}</span>
    </p>
  );
}

/** Category heading, description and trust cues, matching the Figma design. */
function CategoryHeading({ categoryName, description }: CategoryIntroProps) {
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

/** Subcategory pill navigation beneath the heading. */
function SubcategoryTabs({ activeTab }: { activeTab: string }) {
  return (
    <div className="flex w-full flex-wrap gap-[10px]">
      {SUBCATEGORY_TABS.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <Link
            key={tab}
            href={routes.category(toCategorySlug(tab))}
            className={`flex h-11 flex-1 items-center justify-center whitespace-nowrap rounded-[10px] border border-pink px-4 text-[13px] transition-colors ${
              isActive
                ? "bg-pink font-bold text-white"
                : "bg-white text-ink hover:bg-pink/5"
            }`}
          >
            {tab}
          </Link>
        );
      })}
    </div>
  );
}

/** Category introduction: breadcrumb, heading and subcategory tabs. */
export function CategoryIntro({ categoryName, description }: CategoryIntroProps) {
  return (
    <div className="flex w-full flex-col gap-[18px]">
      <Breadcrumb categoryName={categoryName} />
      <CategoryHeading categoryName={categoryName} description={description} />
      <SubcategoryTabs activeTab={`All ${categoryName}`} />
    </div>
  );
}
