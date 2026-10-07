const EXPORT_FEATURES = [
  "✓ Verified export documentation",
  "✓ Duties shown before checkout",
  "✓ Buyer protection in 42 markets",
] as const;

/** Maroon trade-account promotion card. */
function TradeAccount() {
  return (
    <div className="flex flex-1 flex-col gap-[9px] overflow-hidden rounded-2xl bg-maroon p-[22px]">
      <p className="text-[11px] uppercase text-amber">
        For shops &amp; hospitality
      </p>
      <p className="text-[26px] leading-tight text-white">
        Trade pricing that grows with you.
      </p>
      <p className="text-[13px] leading-[1.4] text-white opacity-[0.72]">
        Flexible MOQs, consolidated shipping and one invoice across verified
        suppliers.
      </p>
      <a href="#" className="text-[13px] font-extrabold text-amber">
        Open a trade account →
      </a>
    </div>
  );
}

/** Export-services feature card. */
function ExportServices() {
  return (
    <div className="flex h-full w-[400px] flex-col gap-[10px] rounded-2xl border border-pink bg-white p-[22px]">
      <p className="text-[19px] text-ink">Made for cross-border trade</p>
      <div className="text-[13px] text-ink">
        {EXPORT_FEATURES.map((feature) => (
          <p key={feature} className="leading-[1.65]">
            {feature}
          </p>
        ))}
      </div>
      <a href="#" className="text-[13px] font-extrabold text-pink">
        How global delivery works →
      </a>
    </div>
  );
}

/** Trade and export section pairing the trade account and export cards. */
export function TradeAndExport() {
  return (
    <section className="flex h-[170px] gap-[14px]">
      <TradeAccount />
      <ExportServices />
    </section>
  );
}
