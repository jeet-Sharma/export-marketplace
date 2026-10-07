import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";

/** Large maroon hero promotion with decorative glow and product collage. */
function MainPromotion() {
  return (
    // The large right padding and absolute collage are desktop-only (lg:),
    // so on phones the text uses the full width instead of overflowing behind
    // a fixed 340px gutter.
    <div className="relative flex flex-1 flex-col gap-[13px] overflow-hidden rounded-2xl bg-maroon px-[34px] pb-7 pt-8 lg:pr-[340px]">
      {/* Decorative glow — hidden on small screens where it would overflow. */}
      <Image
        src="/marketplace/glow.svg"
        alt=""
        aria-hidden
        width={380}
        height={380}
        className="pointer-events-none absolute left-[410px] top-[-110px] hidden size-[380px] lg:block"
      />
      {/* Hero products collage — desktop only; it is absolutely sized and
          would clip/overflow on narrow viewports. */}
      <div className="pointer-events-none absolute bottom-0 right-2 hidden h-[275px] w-[355px] lg:block">
        <Image
          src="/marketplace/hero-products.png"
          alt="Export-ready artisan goods"
          fill
          className="object-cover"
          priority
        />
      </div>

      <span className="relative z-10 self-start rounded-full bg-amber px-[11px] py-[6px] text-[11px] uppercase text-ink">
        Curated across borders
      </span>
      <div className="relative z-10 text-[30px] text-white sm:text-[38px]">
        <p className="leading-[1.02]">Beautifully made.</p>
        <p className="leading-[1.02]">Ready to travel.</p>
      </div>
      <p className="relative z-10 max-w-[320px] text-[15px] leading-[1.45] text-white opacity-[0.78]">
        Export-ready goods from verified independent makers in 42 countries.
      </p>
      <Link
        href={routes.products}
        className="relative z-10 self-start rounded-[10px] bg-pink px-[17px] py-[10px] text-[13px] font-extrabold text-white"
      >
        Explore the collection →
      </Link>
    </div>
  );
}

interface SidePromotionProps {
  eyebrow: string;
  title: string;
  action: string;
  variant: "amber" | "pink";
}

/** A compact promotional card used in the side column. */
function SidePromotion({ eyebrow, title, action, variant }: SidePromotionProps) {
  const isAmber = variant === "amber";
  return (
    <div
      className={`flex flex-1 flex-col gap-[7px] rounded-2xl p-[18px] ${
        isAmber ? "bg-amber text-ink" : "bg-pink text-white"
      }`}
    >
      <p className={`text-[10px] uppercase ${isAmber ? "" : "opacity-[0.78]"}`}>
        {eyebrow}
      </p>
      <p className="text-xl leading-[1.08]">{title}</p>
      <p className="text-xs">{action}</p>
    </div>
  );
}

/** Promotional stories row: main hero plus two stacked side promotions. */
export function PromotionalStories() {
  return (
    // Stacks vertically on small screens; the fixed desktop height and the
    // 320px side column only apply from lg: up, preventing mobile overflow.
    <section className="flex flex-col gap-[14px] lg:h-[286px] lg:flex-row">
      <MainPromotion />
      <div className="flex flex-col gap-[14px] lg:h-full lg:w-[320px]">
        <SidePromotion
          variant="amber"
          eyebrow="Wholesale spotlight"
          title="Save 18% on artisan tabletop"
          action="MOQ from 24 units →"
        />
        <SidePromotion
          variant="pink"
          eyebrow="Origin of the week"
          title="Made with care in Portugal"
          action="Shop 86 products →"
        />
      </div>
    </section>
  );
}
