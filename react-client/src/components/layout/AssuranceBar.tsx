const ASSURANCES = [
  "✓ Verified suppliers",
  "✓ Secure payments",
  "✓ Tracked global delivery",
  "✓ Human support",
] as const;

/** Row of trust/assurance statements above the footer. */
export function AssuranceBar() {
  return (
    <div className="flex h-16 items-center justify-between border-y border-black/[0.09] px-[30px] text-[13px] text-ink">
      {ASSURANCES.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}
