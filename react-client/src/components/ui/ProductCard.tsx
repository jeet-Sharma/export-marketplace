import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types/product";
import { routes } from "@/config/routes";

interface ProductCardProps extends Product {
  /** Real product slug (ApiProductListItem.slug) — the card body links to /products/{slug}. */
  slug: string;
  /**
   * Shows the View and REQ actions under the price. View opens the product.
   * REQ is visible but does not submit a quote — there is no quote API yet.
   * The actions sit outside the card link so they are not nested anchors.
   */
  showViewAction?: boolean;
}

/**
 * Product image, details, and pricing. The card body links to the product.
 * View and REQ, when shown, sit outside that link so they are not nested anchors.
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
  const isPresignedUrl =
    typeof image === "string" &&
    (image.includes("X-Amz-") ||
      image.includes("amazonaws.com") ||
      image.includes("localhost:4566"));

  return (
    <article className="flex flex-col overflow-hidden rounded-[10px] border border-black/[0.09] bg-white shadow-[0px_5px_18px_-2px_rgba(17,24,39,0.09)] transition-shadow hover:shadow-[0px_8px_24px_-4px_rgba(17,24,39,0.14)]">
      <Link href={routes.product(slug)} className="flex flex-col">
        {/* Media */}
        <div className="relative flex h-[160px] items-center justify-center bg-cream">
          <div className="relative h-[140px] w-full">
            <Image
              src={image}
              alt={name}
              fill
              unoptimized={isPresignedUrl}
              className="object-contain p-3"
            />
          </div>
          {badge ? (
            <span className="absolute left-[10px] top-[10px] rounded-full bg-pink px-2 py-[5px] text-[10px] font-bold text-white">
              {badge}
            </span>
          ) : null}
        </div>

        {/* Details */}
        <div className={`flex flex-col gap-[5px] px-3 pt-3 ${showViewAction ? "" : "pb-3"}`}>
          <p className="text-[11px] font-extrabold uppercase text-pink">
            {origin}
          </p>
          <h3 className="line-clamp-2 h-[38px] text-[13px] font-normal leading-[1.3] text-ink">
            {name}
          </h3>

          {rating ? (
            <p className="text-xs text-star">
              {rating.replace("·", "/")} reviews
            </p>
          ) : null}

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
        </div>
      </Link>

      {showViewAction ? (
        <div className="flex gap-2 px-3 pb-3 pt-2">
          <Link
            href={routes.product(slug)}
            className="flex h-8 flex-1 items-center justify-center rounded-[8px] bg-pink text-[13px] font-bold text-white"
          >
            View
          </Link>
          <button
            type="button"
            title="Requesting a quote isn't available yet"
            className="flex h-8 w-[72px] shrink-0 items-center justify-center rounded-[8px] border border-pink bg-white text-[13px] font-bold text-pink"
          >
            REQ
          </button>
        </div>
      ) : null}
    </article>
  );
}
