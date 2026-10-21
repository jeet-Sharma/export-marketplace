import type { ReactNode } from "react";

/**
 * Selected-looking radio choice card (delivery method / payment method),
 * matching the Figma "Choice" spec: pink border/tint, filled radio dot,
 * icon chip, title/description, optional trailing label. There's only
 * one real option per section in this phase (no alternate delivery/
 * payment methods to choose between yet), so this always renders as
 * "selected" rather than wiring up actual radio-group state.
 */
export function CheckoutChoiceCard({
  icon,
  title,
  description,
  trailing,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  trailing?: string;
}) {
  return (
    <div className="flex min-h-[66px] w-full items-center gap-3 rounded-[10px] border border-pink bg-pink/10 p-3">
      <span className="flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 border-pink bg-white">
        <span className="size-2 rounded-full bg-pink" />
      </span>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-white text-pink">
        {icon}
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-[13px] font-bold text-ink">{title}</p>
        <p className="text-[12px] leading-[1.35] text-ink/50">{description}</p>
      </div>
      {trailing ? <p className="shrink-0 text-[13px] font-bold text-ink">{trailing}</p> : null}
    </div>
  );
}

/** Static "checked" checkbox + label row, matching the Figma checkbox spec used for preferences/terms acknowledgement. */
export function CheckoutCheckedRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-start gap-2">
      <span className="flex size-[18px] shrink-0 items-center justify-center rounded-[4px] bg-pink text-[11px] font-extrabold text-white">
        ✓
      </span>
      <p className="flex-1 text-[12px] leading-[1.5] text-ink/50">{children}</p>
    </div>
  );
}
