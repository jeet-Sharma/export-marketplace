import type { PublicationStatus, VerificationStatus } from "./productData";

const VERIFICATION_STYLES: Record<
  VerificationStatus,
  { label: string; className: string }
> = {
  verified: {
    label: "Verified supplier",
    className: "bg-bloom-green-surface text-bloom-green",
  },
  pending: {
    label: "Verification pending",
    className: "bg-bloom-amber-surface text-bloom-amber-text",
  },
  unverified: {
    label: "Not verified",
    className: "bg-[#f4f1ee] text-bloom-muted",
  },
};

const PUBLICATION_STYLES: Record<
  PublicationStatus,
  { label: string; dot: string; className: string }
> = {
  published: {
    label: "Published",
    dot: "bg-bloom-green",
    className: "bg-bloom-green-surface text-bloom-green",
  },
  draft: {
    label: "Draft",
    dot: "bg-bloom-muted",
    className: "bg-[#f4f1ee] text-bloom-muted",
  },
  "needs-review": {
    label: "Needs review",
    dot: "bg-bloom-amber-text",
    className: "bg-bloom-amber-surface text-bloom-amber-text",
  },
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const style = VERIFICATION_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1.5 text-[11px] font-semibold ${style.className}`}
    >
      {style.label}
    </span>
  );
}

export function PublicationBadge({ status }: { status: PublicationStatus }) {
  const style = PUBLICATION_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] font-semibold ${style.className}`}
    >
      <span className={`size-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
