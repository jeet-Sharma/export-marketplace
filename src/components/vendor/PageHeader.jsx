import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import NavIcon from "@/components/vendor/NavIcon";
import { vendorProfile } from "@/data/seedData";

// Shared vendor page top bar: title + breadcrumb on the left,
// verification badge, notifications and a primary action on the right.
export default function PageHeader({
  title,
  breadcrumb,
  actionLabel,
  onAction,
}) {
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
            {vendorProfile.verified && (
              <Badge tone="teal">{"\u2713"} Verified Supplier</Badge>
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
