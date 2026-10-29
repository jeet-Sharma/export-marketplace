import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";
import { routes } from "@/config/routes";

/**
 * Custom 404 handler for the whole app.
 *
 * Most routes that 404 today (/sign-in, /orders, /trade-account, etc.) are
 * real planned pages that haven't been built yet — so instead of Next.js's
 * default "404 | This page could not be found" we show a friendly
 * "Work in Progress" screen that matches the site's look and feel.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col bg-cream font-sans">
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-7 py-20">
        <div className="flex w-full max-w-[480px] flex-col items-center gap-6 text-center">

          {/* Animated construction icon */}
          <div className="relative flex size-[96px] items-center justify-center rounded-[24px] bg-amber/15">
            <svg
              width="52"
              height="52"
              viewBox="0 0 52 52"
              fill="none"
              aria-hidden
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Hard hat */}
              <path
                d="M10 28C10 20.268 17.163 14 26 14C34.837 14 42 20.268 42 28H10Z"
                fill="#F4A340"
              />
              <rect x="8" y="28" width="36" height="5" rx="2.5" fill="#F4A340" />
              {/* Brim highlight */}
              <path
                d="M10 28C10 20.268 17.163 14 26 14C34.837 14 42 20.268 42 28"
                stroke="#e08d28"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Stripe */}
              <path
                d="M26 14V28"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.6"
              />
              {/* Tools — wrench */}
              <path
                d="M17 36L22 41"
                stroke="#57172f"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="15.5" cy="37.5" r="3" stroke="#57172f" strokeWidth="2" fill="none" />
              {/* Shovel */}
              <path
                d="M35 36L30 41"
                stroke="#57172f"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="36.5" cy="37.5" r="3" stroke="#57172f" strokeWidth="2" fill="none" />
            </svg>
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-[6px]">
            <h1 className="text-[26px] font-bold leading-tight text-ink">
              Work in Progress
            </h1>
            <p className="text-[14px] leading-[1.55] text-ink/55">
              This page is being built. Check back soon — we&apos;re adding new
              features to Export Marketplace regularly.
            </p>
          </div>

          {/* Pill progress bar — purely decorative */}
          <div className="w-full overflow-hidden rounded-full bg-black/[0.06]">
            <div
              className="h-[6px] rounded-full bg-gradient-to-r from-amber to-pink"
              style={{ width: "62%" }}
            />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/35">
            Coming soon
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={routes.products}
              className="flex h-[40px] items-center rounded-[10px] bg-pink px-5 text-[13px] font-bold text-white shadow-[0px_2px_10px_rgba(217,66,114,0.28)] transition-all duration-150 hover:bg-pink-hover hover:shadow-[0px_4px_14px_rgba(217,66,114,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2"
            >
              Browse products
            </Link>
            <Link
              href={routes.home}
              className="flex h-[40px] items-center rounded-[10px] border border-black/[0.09] bg-white px-5 text-[13px] font-semibold text-ink transition-colors duration-150 hover:border-pink/40 hover:text-pink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2"
            >
              Go home
            </Link>
          </div>

        </div>
      </main>

      <section className="flex flex-col bg-white">
        <Footer />
      </section>
    </div>
  );
}
