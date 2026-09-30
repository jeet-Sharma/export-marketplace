import Link from "next/link";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import ProductSummaryCard from "@/components/shared/ProductSummaryCard";
import { wishlistMeta } from "@/data/buyerWishlist";
import type { WishlistItem } from "@/types/wishlist";

export interface WishlistGridProps {
  items?: WishlistItem[];
  onRemove?: (item: WishlistItem) => void;
  onAddToCart?: (item: WishlistItem) => void;
}

// Saved-product grid — uses the shared ProductSummaryCard (same anatomy as
// the public homepage's FeaturedProductsSection.tsx), adding two
// buyer-specific actions (Add to Cart, Remove) instead of the public
// card's single "View".
export default function WishlistGrid({ items = [], onRemove, onAddToCart }: WishlistGridProps) {
  if (items.length === 0) {
    return (
      <Panel bodyClassName="p-6 text-center">
        <p className="font-body text-text-dim text-[13px]">{wishlistMeta.emptyMessage}</p>
      </Panel>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <ProductSummaryCard
          key={item.id}
          emoji={item.emoji}
          name={item.name}
          price={item.price}
          moq={item.moq}
          supplierName={item.supplierName}
          supplierVerified={item.supplierVerified}
          actions={
            <>
              <div className="flex gap-2 mt-1">
                <Button
                  variant="accent"
                  size="sm"
                  className="flex-1"
                  onClick={() => onAddToCart?.(item)}
                  disabled={!onAddToCart}
                >
                  Add to Cart
                </Button>
                <Link href={`/products/${item.productId}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
              </div>
              <Button
                variant="danger"
                size="sm"
                className="w-full"
                onClick={() => onRemove?.(item)}
                disabled={!onRemove}
              >
                Remove
              </Button>
            </>
          }
        />
      ))}
    </div>
  );
}
