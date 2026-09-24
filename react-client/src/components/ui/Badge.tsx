import type { ReactNode } from "react";
import type { BadgeTone } from "@/types/ui";

// Generic badge / pill. Pass a `tone` shortcut for one of the palette pairs,
// or explicit `className` overrides (e.g. from StatusPill) for arbitrary
// foreground/background token pairs not covered by the shortcuts below.
const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "text-text-dim bg-paper",
  saffron: "text-saffron bg-saffron-soft",
  teal: "text-teal bg-teal-soft",
  blueGrey: "text-blue-grey bg-blue-grey-soft",
  coral: "text-coral bg-coral-soft",
};

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

export default function Badge({ children, tone = "neutral", className = "" }: BadgeProps) {
  const toneClass = TONE_CLASSES[tone] ?? TONE_CLASSES.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1 font-body font-medium rounded px-2 py-[3px] text-[12px] leading-[1.2] whitespace-nowrap ${toneClass} ${className}`}
    >
      {children}
    </span>
  );
}
