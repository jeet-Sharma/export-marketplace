import { NAV_LINKS } from "@/data/navigation";

/** Dark category navigation strip beneath the primary nav. */
export function CategoryNav() {
  return (
    <nav className="flex h-10 items-center justify-between bg-ink px-7 text-[13px] text-white">
      <span className="font-extrabold">☰ All categories</span>
      {NAV_LINKS.map((link) => (
        <a key={link} href="#" className="font-semibold">
          {link}
        </a>
      ))}
      <a href="#" className="font-extrabold text-amber">
        Sell globally ↗
      </a>
    </nav>
  );
}
