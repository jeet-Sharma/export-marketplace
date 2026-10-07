import { SHOP_CATEGORIES } from "@/data/navigation";

/** "Shop by category" section with a row of category chips. */
export function ShopByCategory() {
  return (
    <section className="flex flex-col gap-[13px]">
      <div className="flex items-center justify-between">
        <h2 className="text-[23px] text-ink">Shop by category</h2>
        <a href="#" className="text-[13px] text-pink">
          View all categories →
        </a>
      </div>
      <div className="flex gap-[10px]">
        {SHOP_CATEGORIES.map((category) => (
          <a
            key={category}
            href="#"
            className="flex h-[46px] flex-1 items-center justify-center rounded-[10px] border border-pink bg-white text-[13px] text-ink shadow-[0px_5px_18px_-2px_rgba(17,24,39,0.09)]"
          >
            {category}
          </a>
        ))}
      </div>
    </section>
  );
}
