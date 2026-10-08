const ASSURANCES = [
  { icon: "✓", label: "Verified suppliers" },
  { icon: "✓", label: "Secure payments" },
  { icon: "✓", label: "Tracked global delivery" },
  { icon: "✓", label: "Human support" },
] as const;

/** Row of trust/assurance statements beneath the hero banner, matching the Figma design. */
export function AssuranceBar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-black/[0.07] bg-white px-6 py-3 shadow-[0px_2px_10px_rgba(17,24,39,0.05)]">
      {ASSURANCES.map((item) => (
        <p key={item.label} className="flex items-center gap-[6px] text-[13px] text-ink">
          <span className="flex size-5 items-center justify-center rounded-full bg-delivery/10 text-[11px] font-bold text-delivery">
            {item.icon}
          </span>
          {item.label}
        </p>
      ))}
    </div>
  );
}
