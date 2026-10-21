import type { ReactNode } from "react";

/** Shared white card shell + numbered section heading, matching every "Checkout section" in the Figma design. */
export function CheckoutSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex w-full flex-col gap-4 rounded-[16px] border border-border bg-white p-[22px] shadow-[0px_5px_18px_-2px_rgba(17,24,39,0.09)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-[18px] text-ink">{title}</h2>
        <p className="text-[13px] leading-[1.45] text-ink/50">{description}</p>
      </div>
      {children}
    </section>
  );
}
