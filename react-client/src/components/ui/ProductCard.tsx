import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { routes } from "@/config/routes";

interface ProductCardProps extends Product {
  /**
   * Shows a secondary "RFQ" (request for quote) action next to "View" —
   * used on the catalogue/listing screen. Defaults to false so the compact
   * homepage trending grid (which has no RFQ action in Figma) is unaffected.
   */
  showRfqAction?: boolean;
}

/** Displays a single trending product with image, details, pricing and MOQ line. */
export function ProductCard({
  image,
  badge,
  origin,
  name,
  rating,
  price,
  oldPrice,
  delivery,
  showRfqAction = false,
}: ProductCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-[10px] border border-black/[0.09] bg-white shadow-[0px_5px_18px_-2px_rgba(17,24,39,0.09)] transition-shadow hover:shadow-[0px_8px_24px_-4px_rgba(17,24,39,0.14)]">
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

        {/* MOQ line matching Figma */}
        <p className="text-[11px] text-ink/50">MOQ &amp; wholesale price: enquire</p>

        {showRfqAction ? (
          <div className="flex gap-2 pt-1">
            <Link
              href={routes.product(name)}
              className="flex h-8 flex-1 items-center justify-center rounded-[8px] bg-pink text-[13px] font-bold text-white transition-colors hover:bg-pink/90"
            >
              View
            </Link>
            <Link
              href={routes.requestQuote(name)}
              className="flex h-8 flex-1 items-center justify-center rounded-[8px] border border-pink text-[13px] font-bold text-pink transition-colors hover:bg-pink/5"
            >
              RFQ
            </Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}
