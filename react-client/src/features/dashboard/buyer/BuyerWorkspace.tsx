import { GlobeIcon } from "../components/icons";

/**
 * Placeholder buyer home. The buyer-facing catalog/browse experience isn't
 * built yet, but a buyer must never be shown the admin product-management
 * workspace (catalog review, Add product, verification status) — so the user
 * role gets this honest "coming soon" surface instead of the admin screen.
 */
export function BuyerWorkspace() {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-extrabold uppercase text-bloom-pink">
          Buyer home
        </p>
        <h1 className="text-[30px] font-semibold text-bloom-ink">
          Browse market
        </h1>
        <p className="text-[13px] text-bloom-muted">
          Discover verified exporters and request quotes.
        </p>
      </div>

      <div className="flex min-h-[260px] w-full flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-bloom-border bg-bloom-surface p-10 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#fbeaf0]">
          <GlobeIcon className="size-6 text-bloom-pink" />
        </div>
        <p className="text-[15px] font-semibold text-bloom-ink">
          The buyer marketplace is coming soon
        </p>
        <p className="max-w-[380px] text-[13px] text-bloom-muted">
          Product browsing, quote requests, and order tracking for buyers are
          in progress. Check back shortly.
        </p>
      </div>
    </>
  );
}
