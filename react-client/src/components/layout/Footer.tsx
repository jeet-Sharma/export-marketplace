import Link from "next/link";
import { FOOTER_LINKS } from "@/data/navigation";
import { footerRoutes, routes } from "@/config/routes";

/** Site footer with brand, tagline, links and copyright. */
export function Footer() {
  return (
    <footer className="flex min-h-14 flex-wrap items-center justify-between gap-x-6 gap-y-2 bg-ink px-[30px] py-3 text-white">
      <p className="text-[19px]">looma</p>
      <p className="text-xs opacity-60">
        The shared market for independent goods.
      </p>
      <nav className="flex flex-wrap gap-6 text-xs opacity-75">
        {FOOTER_LINKS.map((link) => (
          <Link key={link} href={footerRoutes[link] ?? routes.home}>
            {link}
          </Link>
        ))}
      </nav>
      <p className="text-[11px] opacity-50">© 2026 Looma Market Ltd.</p>
    </footer>
  );
}
