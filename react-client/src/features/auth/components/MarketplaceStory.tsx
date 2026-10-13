import { SproutIcon } from "./icons";
import { ProofItem } from "./ProofItem";

const PROOF_STATS = [
  { value: "42", label: "markets connected" },
  { value: "100%", label: "verified suppliers" },
  { value: "24/7", label: "secure account access" },
];

export function MarketplaceStory() {
  return (
    <aside className="relative hidden w-[620px] shrink-0 flex-col justify-between overflow-hidden bg-bloom-plum-deep p-10 lg:flex">
      {/* Background image — replace with a real botanical commerce asset in /public */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/auth/marketplace-story.jpg')" }}
        aria-hidden
      />
      {/* Image wash */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-bloom-plum/15 via-bloom-plum-deep/45 to-bloom-plum-deep/95"
        aria-hidden
      />

      <div className="relative flex w-fit items-center gap-[7px] rounded-full bg-white/90 px-3 py-[7px] shadow-[0px_6px_18px_-2px_rgba(27,32,48,0.1)]">
        <SproutIcon className="size-[15px]" />
        <span className="text-[10px] font-extrabold uppercase text-bloom-green">
          Trade with confidence
        </span>
      </div>

      <div className="relative flex w-full flex-col gap-5">
        <div className="flex flex-col gap-3 text-white">
          <h2 className="w-[410px] max-w-full text-[46px] leading-[1.03]">
            Your market, in full bloom.
          </h2>
          <p className="w-[420px] max-w-full text-[15px] leading-[1.55] opacity-80">
            Sign in to source verified goods, manage orders, and grow trusted
            relationships across borders.
          </p>
        </div>
        <div className="flex w-full gap-[22px] border-t border-white/20 pt-[18px]">
          {PROOF_STATS.map((stat) => (
            <ProofItem key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
      </div>
    </aside>
  );
}
