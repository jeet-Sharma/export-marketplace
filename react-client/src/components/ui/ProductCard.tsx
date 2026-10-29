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
 * Compact product card — image area 180px tall with a white background,
 * a subtle camera-icon overlay (bottom-left), and a clean object-contain
 * image that fills most of the tile — matching the Alibaba-style reference.
 *
 * Hover effects:
 * - Card lifts with a deeper shadow + pink border tint (transition-all)
 * - Product image zooms in subtly (scale-[1.06], motion-safe only)
 * - Product name fades to pink on hover
 * - View/REQ buttons reveal hover/focus rings
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
    <article className="group flex flex-col overflow-hidden rounded-[10px] border border-black/[0.09] bg-white shadow-[0px_4px_14px_-2px_rgba(17,24,39,0.08)] transition-all duration-300 hover:border-pink/20 hover:shadow-[0px_12px_30px_-4px_rgba(17,24,39,0.18)]">
      <Link href={routes.product(slug)} className="flex flex-col">
        {/* Image frame — white bg, 180px tall, nearly square at typical card widths */}
        <div className="relative h-[180px] w-full overflow-hidden bg-white">
          <div className="relative h-full w-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.13]">
            <Image
              src={image}
              alt={name}
              fill
              unoptimized={isPresignedUrl}
              className="object-contain p-4"
            />
          </div>

          {/* Badge — top-left */}
          {badge ? (
            <span className="absolute left-[8px] top-[8px] rounded-full bg-pink px-[7px] py-[4px] text-[9px] font-bold text-white">
              {badge}
            </span>
          ) : null}

          {/* Camera / zoom icon — bottom-left, matching the reference design */}
          <span
            aria-hidden
            className="absolute bottom-[8px] left-[8px] flex size-[26px] items-center justify-center rounded-full bg-white/90 shadow-[0px_1px_4px_rgba(0,0,0,0.15)]"
          >
            {/* Simple camera outline icon via SVG */}
            <svg
              width="13"
              height="11"
              viewBox="0 0 13 11"
              fill="none"
              aria-hidden
              xmlns="http://www.w3.org/2000/svg"
              className="text-ink/50"
            >
              <path
                d="M4.5 1L3.5 2.5H1.5C0.948 2.5 0.5 2.948 0.5 3.5V9.5C0.5 10.052 0.948 10.5 1.5 10.5H11.5C12.052 10.5 12.5 10.052 12.5 9.5V3.5C12.5 2.948 12.052 2.5 11.5 2.5H9.5L8.5 1H4.5Z"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinejoin="round"
              />
              <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1" />
            </svg>
          </span>
        </div>

        {/* Text content */}
        <div className={`flex flex-col gap-[2px] px-[10px] pt-[10px] ${showViewAction ? "" : "pb-[10px]"}`}>
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-pink">
            {origin}
          </p>
          <h3 className="line-clamp-2 h-[32px] text-[12px] font-normal leading-[1.3] text-ink transition-colors duration-150 group-hover:text-pink">
            {name}
          </h3>

          {rating ? (
            <p className="text-[11px] text-star">
              {rating.replace("·", "/")} reviews
            </p>
          ) : null}

          <p className="text-[15px] font-semibold text-ink">
            {price}
            {oldPrice ? (
              <span className="ml-2 text-[12px] font-normal line-through opacity-40">
                {oldPrice}
              </span>
            ) : null}
          </p>

          {delivery ? (
            <p className="text-[10px] font-bold text-delivery">{delivery}</p>
          ) : null}
        </div>
      </Link>

      {showViewAction ? (
        <div className="flex gap-[6px] px-[10px] pb-[10px] pt-[6px]">
          <Link
            href={routes.product(slug)}
            className="flex h-[30px] flex-1 items-center justify-center rounded-[7px] bg-pink text-[12px] font-bold text-white transition-colors duration-150 hover:bg-pink-hover active:bg-pink-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-1"
          >
            View
          </Link>
          <button
            type="button"
            title="Requesting a quote isn't available yet"
            className="flex h-[30px] flex-1 items-center justify-center rounded-[7px] border border-pink bg-white text-[12px] font-bold text-pink transition-colors duration-150 hover:bg-cream hover:border-pink-hover hover:text-pink-hover active:bg-pink/10 active:text-pink-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-45"
          >
            REQ
          </button>
        </div>
      ) : null}
    </article>
  );
}
