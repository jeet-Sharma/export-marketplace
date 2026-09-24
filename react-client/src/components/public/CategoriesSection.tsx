import Panel from "@/components/ui/Panel";
import { categories } from "@/data/public";

// Browse-by-category grid (Spices / Textiles / Handicrafts / Agriculture).
export default function CategoriesSection() {
  return (
    <section className="w-full px-4 py-10 sm:px-6">
      <h2 className="font-heading font-bold text-ink text-[22px] mb-4">
        Browse Categories
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Panel key={category.id} bodyClassName="p-4 flex flex-col items-center gap-2 text-center">
            <span className="text-[28px]" aria-hidden="true">
              {category.emoji}
            </span>
            <p className="font-heading font-semibold text-ink text-[14px]">
              {category.label}
            </p>
            <p className="font-body text-text-dim text-[12px]">
              {category.productCount}+ products
            </p>
          </Panel>
        ))}
      </div>
    </section>
  );
}
