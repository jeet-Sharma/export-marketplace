import type { ApiProductDetail } from "@/features/products/types/product-api.types";

interface ProductSupplierCardProps {
  vendor: ApiProductDetail["vendor"];
}

/** Generic placeholder avatar (initials on a tinted circle) — the DB has no supplier photo/logo field, so a real image is never faked here. */
function SupplierAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex size-[76px] shrink-0 items-center justify-center rounded-[10px] bg-cream text-[22px] font-bold text-pink">
      {initials || "?"}
    </div>
  );
}

/**
 * "Verification overview" column, matching the Figma layout. There is no
 * verification feature or data on the backend (Vendor.status is only
 * ACTIVE/INACTIVE — no identity/export-record/document verification
 * concept exists), so every value here is a static, visibly-labeled
 * placeholder rather than a real per-supplier status. Shown in a muted
 * gray tone (not the green/bold styling a real "Checked" status would
 * use in the Figma mock) specifically so it reads as "not yet available"
 * rather than as an actual verified fact about this supplier.
 */
function VerificationOverview() {
  return (
    <div className="flex flex-1 flex-col gap-3 border-y border-border py-5 sm:border-y-0 sm:border-x sm:px-6 sm:py-0">
      <p className="text-[13px] font-bold text-ink">Verification overview</p>
      <div className="flex gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-bold text-ink/40">Not available</p>
          <p className="text-[12px] text-ink/50">Business identity</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-bold text-ink/40">Not available</p>
          <p className="text-[12px] text-ink/50">Export records</p>
        </div>
      </div>
      <p className="text-[11px] leading-[1.5] text-ink/40">
        Supplier verification isn&apos;t available yet. Confirm product
        documents and contract terms directly with the supplier before
        ordering.
      </p>
    </div>
  );
}

/**
 * "Trade with confidence" column. Same reasoning as VerificationOverview:
 * the Figma copy ("Supplier identity verified", "Secure message
 * history", "Human support for disputes") describes platform guarantees
 * that don't exist yet (no verification, no messaging, no support/
 * dispute feature) — rendered muted/struck-through rather than as live
 * checkmarked assurances, so the UI doesn't claim protections the
 * marketplace doesn't actually provide. "Message supplier" is visibly
 * disabled (gray, not the pink primary action) and labeled, not a dead
 * button that looks live but does nothing.
 */
function TradeConfidence() {
  return (
    <div className="flex flex-1 flex-col gap-3 sm:w-[220px]">
      <p className="text-[13px] font-bold text-ink">Trade with confidence</p>
      <ul className="flex flex-col gap-[6px] text-[13px] text-ink/40">
        <li>Supplier identity verification — not yet available</li>
        <li>Secure message history — not yet available</li>
        <li>Human support for disputes — not yet available</li>
      </ul>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          disabled
          title="Supplier messaging isn't available yet"
          className="flex h-[38px] w-full items-center justify-center rounded-[6px] border border-border bg-cream text-[13px] font-bold text-ink/40 disabled:cursor-not-allowed"
        >
          Message supplier
        </button>
        <p className="text-center text-[11px] text-ink/40">Coming soon</p>
      </div>
    </div>
  );
}

/**
 * Supplier information card, matching the Figma "Meet the supplier"
 * layout: avatar + identity on the left, a "Verification overview"
 * column, and a "Trade with confidence" column with the message action.
 * Only the left identity block uses real Vendor fields (companyName,
 * displayName, email, phone). The other two columns are static
 * placeholders — see VerificationOverview/TradeConfidence comments for
 * why: there is no verification or messaging feature on the backend
 * today, so nothing there is a real per-supplier fact.
 */
export function ProductSupplierCard({ vendor }: ProductSupplierCardProps) {
  const vendorName = vendor.displayName ?? vendor.companyName;

  return (
    <section id="supplier" className="flex w-full flex-col gap-[18px]">
      <h2 className="text-[26px] text-ink">Meet the supplier</h2>
      <div className="flex flex-col gap-6 rounded-[16px] border border-border bg-white p-[22px] shadow-[0px_5px_18px_-2px_rgba(17,24,39,0.09)] sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-[14px] sm:max-w-[300px]">
          <SupplierAvatar name={vendorName} />
          <div className="flex flex-col gap-1">
            <p className="text-[18px] font-bold text-ink">{vendorName}</p>
            {vendor.email ? (
              <a href={`mailto:${vendor.email}`} className="text-[13px] text-pink hover:underline">
                {vendor.email}
              </a>
            ) : null}
            {vendor.phone ? <p className="text-[13px] text-ink/60">{vendor.phone}</p> : null}
          </div>
        </div>

        <VerificationOverview />
        <TradeConfidence />
      </div>
    </section>
  );
}
