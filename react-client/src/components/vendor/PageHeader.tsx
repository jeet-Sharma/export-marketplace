import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import NavIcon from "@/components/vendor/NavIcon";

export interface PageHeaderProps {
  title: string;
  breadcrumb?: string;
  actionLabel?: string;
  onAction?: () => void;
  /**
   * Shows the verification badge when true. Required (no default) since
   * this component is shared by both the vendor and buyer portals — a
   * silent fallback to one portal's profile data would show the wrong
   * badge on the other portal's pages if a caller forgot to pass it.
   * Callers pass their own portal's profile flag, e.g.
   * vendorProfile.verified or buyerProfileSummary.verified.
   */
  verified: boolean;
  /** Badge label shown when `verified` is true, e.g. "Verified Supplier"
   * or "Verified Buyer". */
  verifiedLabel: string;
}

// Shared page top bar (used by both the vendor and buyer portals): title +
// breadcrumb on the left, verification badge, notifications and a primary
// action on the right.
export default function PageHeader({
  title,
  breadcrumb,
  actionLabel,
  onAction,
  verified,
  verifiedLabel,
}: PageHeaderProps) {
  return (
    <header className="bg-panel border-b border-line">
      <div className="w-full px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading font-bold text-ink text-[22px] leading-[1.2]">
              {title}
            </h1>
            {breadcrumb && (
              <p className="font-body mt-1 text-text-dim text-[12px]">
                {breadcrumb}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {verified && (
              <Badge tone="teal">{"\u2713"} {verifiedLabel}</Badge>
            )}
            <button
              type="button"
              aria-label="Notifications"
              className="inline-flex items-center justify-center text-saffron bg-transparent border-none cursor-pointer p-1"
            >
              <NavIcon name="bell" size={18} />
            </button>
            {actionLabel && (
              <Button variant="accent" size="md" onClick={onAction}>
                {actionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
