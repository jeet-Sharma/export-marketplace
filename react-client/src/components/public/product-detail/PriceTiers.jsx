// Bulk pricing tiers table (quantity range -> price).
export default function PriceTiers({ tiers = [] }) {
  return (
    <div className="flex flex-col gap-2">
      {tiers.map((tier) => (
        <div
          key={tier.range}
          className="flex items-center justify-between bg-paper border border-line rounded px-3 py-2"
        >
          <span className="font-body text-text-dim text-[13px]">{tier.range}</span>
          <span className="font-heading font-semibold text-ink text-[14px]">
            {tier.price}
          </span>
        </div>
      ))}
    </div>
  );
}
