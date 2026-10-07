import Link from "next/link";
import { NAV_LINKS } from "@/data/navigation";
import { routes, toCategorySlug } from "@/config/routes";

/** Dark category navigation strip beneath the primary nav. */
export function CategoryNav() {
  return (
    <nav className="flex h-10 flex-wrap items-center justify-between gap-x-4 bg-ink px-7 text-[13px] text-white">
      <span className="font-extrabold">☰ All categories</span>
      {NAV_LINKS.map((link) => (
        <Link
          key={link}
          href={routes.category(toCategorySlug(link))}
          className="font-semibold"
        >
          {link}
        </Link>
      ))}
      <Link href={routes.sellGlobally} className="font-extrabold text-amber">
        Sell globally ↗
      </Link>
    </nav>
  );
}
