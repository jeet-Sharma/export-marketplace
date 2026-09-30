import type { ReactNode } from "react";
import Panel from "@/components/ui/Panel";
import Badge from "@/components/ui/Badge";

export interface ProductSummaryCardProps {
  emoji: string;
  name: string;
  /** Display-ready price string, e.g. "$8/kg" — see types/public.ts
   * FeaturedProduct / types/wishlist.ts WishlistItem. */
  price: string;
  moq: string;
  supplierName: string;
  supplierVerified: boolean;
  /** Action button(s) shown below the supplier row — a single "View" on
   * the public homepage, "Add to Cart"/"View"/"Remove" on the wishlist.
   * Each caller owns its own actions since they differ by context. */
  actions: ReactNode;
}

// Shared product summary card — same emoji swatch + name/price/MOQ +
// supplier row anatomy used by the public homepage's
// FeaturedProductsSection.tsx and the buyer portal's WishlistGrid.tsx.
// Both places render a saved/catalog product the same way; only the
// action buttons underneath differ; those are passed in rather than
// duplicated here.
export default function ProductSummaryCard({
  emoji,
  name,
  price,
  moq,
  supplierName,
  supplierVerified,
  actions,
}: ProductSummaryCardProps) {
  return (
    <Panel bodyClassName="p-4 flex flex-col gap-3">
      <div
        className="flex items-center justify-center h-[96px] bg-paper rounded text-[36px]"
        aria-hidden="true"
      >
        {emoji}
      </div>

      <div>
        <p className="font-heading font-semibold text-ink text-[14px]">{name}</p>
        <p className="font-body text-text text-[13px] mt-1">{price}</p>
        <p className="font-body text-text-dim text-[12px]">{moq}</p>
      </div>

      <div className="flex items-center gap-1">
        <p className="font-body text-text-dim text-[12px]">{supplierName}</p>
        {supplierVerified && <Badge tone="teal">{"\u2713"}</Badge>}
      </div>

      {actions}
    </Panel>
  );
}
