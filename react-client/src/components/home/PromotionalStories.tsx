import Image from "next/image";

/** Large maroon hero promotion with decorative glow and product collage. */
function MainPromotion() {
  return (
    <div className="relative flex flex-1 flex-col gap-[13px] overflow-hidden rounded-2xl bg-maroon pb-7 pl-[34px] pr-[340px] pt-8">
      {/* Decorative glow */}
      <Image
        src="/marketplace/glow.svg"
        alt=""
        aria-hidden
        width={380}
        height={380}
        className="pointer-events-none absolute left-[410px] top-[-110px] size-[380px]"
      />
      {/* Hero products collage */}
      <div className="pointer-events-none absolute bottom-0 right-2 h-[275px] w-[355px]">
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
      <div className="relative z-10 text-[38px] text-white">
        <p className="leading-[1.02]">Beautifully made.</p>
        <p className="leading-[1.02]">Ready to travel.</p>
      </div>
      <p className="relative z-10 max-w-[320px] text-[15px] leading-[1.45] text-white opacity-[0.78]">
        Export-ready goods from verified independent makers in 42 countries.
      </p>
      <a
        href="#"
        className="relative z-10 self-start rounded-[10px] bg-pink px-[17px] py-[10px] text-[13px] font-extrabold text-white"
      >
        Explore the collection →
      </a>
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
    <section className="flex h-[286px] gap-[14px]">
      <MainPromotion />
      <div className="flex h-full w-[320px] flex-col gap-[14px]">
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
