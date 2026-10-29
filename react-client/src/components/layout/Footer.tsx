import Link from "next/link";
import { footerRoutes, routes } from "@/config/routes";

const FOOTER_COLUMNS = [
  {
    heading: "Marketplace",
    links: [
      { label: "All products", href: routes.products },
      { label: "New arrivals", href: routes.newArrivals },
      { label: "Sell on Export Marketplace", href: routes.sellGlobally },
      { label: "Trade account", href: routes.tradeAccount },
    ],
  },
  {
    heading: "Export",
    links: [
      { label: "How it works", href: routes.exportServices },
      { label: "Global delivery", href: routes.exportServices },
      { label: "Duties & taxes", href: routes.exportServices },
      { label: "Trade account", href: routes.tradeAccount },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: footerRoutes["About"] ?? routes.home },
      { label: "Help & support", href: footerRoutes["Help"] ?? routes.home },
      { label: "Terms of use", href: footerRoutes["Terms"] ?? routes.home },
    ],
  },
] as const;

/** Full-width site footer with brand column, link columns, and bottom bar. */
export function Footer() {
  return (
    <footer className="bg-ink text-white">

      {/* ── Main footer body ─────────────────────────────────────────── */}
      <div className="mx-auto flex w-full flex-col gap-10 px-8 py-12 lg:flex-row lg:gap-16">

        {/* Brand column */}
        <div className="flex flex-col gap-4 lg:w-[220px] lg:shrink-0">
          <Link
            href={routes.home}
            className="text-[24px] font-bold tracking-tight text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink rounded"
          >
            Export Marketplace
          </Link>
          <p className="text-[13px] leading-[1.6] text-white/55">
            The shared market for independent goods. Export-ready products from
            verified makers in 42 countries.
          </p>
          {/* Social placeholders */}
          <div className="flex items-center gap-[10px] pt-1">
            {(["X", "Li", "In"] as const).map((s) => (
              <span
                key={s}
                aria-hidden
                className="flex size-[32px] items-center justify-center rounded-full border border-white/15 text-[11px] font-bold text-white/40"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Link columns */}
        <div className="grid flex-1 grid-cols-2 gap-8 sm:grid-cols-3">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-4">
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/40">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-[10px]">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-white/65 transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60 rounded"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.08] px-8 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-white/35">
            © 2026 Export Marketplace Ltd. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link
              href={footerRoutes["Terms"] ?? routes.home}
              className="text-[12px] text-white/40 transition-colors hover:text-white/70 focus-visible:outline-none"
            >
              Terms
            </Link>
            <Link
              href={footerRoutes["Help"] ?? routes.home}
              className="text-[12px] text-white/40 transition-colors hover:text-white/70 focus-visible:outline-none"
            >
              Privacy
            </Link>
            <Link
              href={footerRoutes["Help"] ?? routes.home}
              className="text-[12px] text-white/40 transition-colors hover:text-white/70 focus-visible:outline-none"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>

    </footer>
  );
}
