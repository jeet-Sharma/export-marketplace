import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { routes } from "@/config/routes";

interface ProductCardProps extends Product {
  /** Real product slug (ApiProductListItem.slug) — the card's entire body links to /products/{slug}. */
  slug: string;
  /**
   * Shows an explicit "View details" action beneath the price — used on the
   * catalogue/listing screen. Defaults to false so the compact homepage
   * trending grid (which has no explicit action button in Figma) is
   * unaffected; the whole card is always a link regardless of this prop.
   */
  showViewAction?: boolean;
}

/**
 * Displays a single product with image, details and pricing. The entire
 * card is a single `next/link` `<Link>` to the product's detail page — no
 * nested interactive elements inside it, so there's no risk of a nested
 * `<a>`/click-handler stealing or duplicating navigation (see marketplace
 * routing requirements: "nested interactive elements must not cause
 * accidental navigation").
 */
export function ProductCard({
  slug,
  image,
  badge,
  origin,
  name,
  rating,
  price,
  oldPrice,
  delivery,
  showViewAction = false,
}: ProductCardProps) {
  return (
    <Link
      href={routes.product(slug)}
      className="flex flex-col overflow-hidden rounded-[10px] border border-black/[0.09] bg-white shadow-[0px_5px_18px_-2px_rgba(17,24,39,0.09)] transition-shadow hover:shadow-[0px_8px_24px_-4px_rgba(17,24,39,0.14)]"
    >
      {/* Media */}
      <div className="relative flex h-[160px] items-center justify-center bg-cream">
        <div className="relative h-[140px] w-full">
          <Image src={image} alt={name} fill className="object-contain p-3" />
        </div>
        {badge ? (
          <span className="absolute left-[10px] top-[10px] rounded-full bg-pink px-2 py-[5px] text-[10px] font-bold text-white">
            {badge}
          </span>
        ) : null}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-[5px] p-3">
        <p className="text-[11px] font-extrabold uppercase text-pink">
          {origin}
        </p>
        <h3 className="line-clamp-2 h-[38px] text-[13px] font-normal leading-[1.3] text-ink">
          {name}
        </h3>

        {/* Rating with star count */}
        {rating ? (
          <p className="text-xs text-star">
            {rating.replace("·", "/")} reviews
          </p>
        ) : null}

        {/* Pricing */}
        <p className="text-[17px] font-semibold text-ink">
          {price}
          {oldPrice ? (
            <span className="ml-2 text-[13px] font-normal line-through opacity-40">
              {oldPrice}
            </span>
          ) : null}
        </p>

        {delivery ? (
          <p className="text-[11px] font-bold text-delivery">{delivery}</p>
        ) : null}

        {showViewAction ? (
          <span className="mt-1 flex h-8 w-full items-center justify-center rounded-[8px] bg-pink text-[13px] font-bold text-white transition-colors group-hover:bg-pink/90">
            View details
          </span>
        ) : null}
      </div>
    </Link>
  );
}
