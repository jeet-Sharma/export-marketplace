import Image from "next/image";
import type { Product } from "@/types/product";

type ProductCardProps = Product;

/** Displays a single trending product with image, details and pricing. */
export function ProductCard({
  image,
  badge,
  origin,
  name,
  rating,
  price,
  oldPrice,
  delivery,
}: ProductCardProps) {
  return (
    <article className="flex h-[304px] flex-col overflow-hidden rounded-[10px] border border-black/[0.09] bg-white shadow-[0px_5px_18px_-2px_rgba(17,24,39,0.09)]">
      {/* Media */}
      <div className="relative flex h-[145px] items-center justify-center bg-cream">
        <div className="relative h-[132px] w-[185px]">
          <Image src={image} alt={name} fill className="object-cover" />
        </div>
        <span className="absolute left-[10px] top-[10px] rounded-full bg-pink px-2 py-[5px] text-[10px] text-white">
          {badge}
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-[6px] p-3">
        <p className="text-[11px] font-extrabold uppercase text-pink">
          {origin}
        </p>
        <h3 className="line-clamp-2 h-[38px] text-[14px] font-normal leading-[1.3] text-ink">
          {name}
        </h3>
        <p className="text-xs text-star">{rating}</p>
        <p className="text-[18px] text-ink">
          {price}
          {oldPrice ? (
            <span className="ml-2 line-through opacity-50">{oldPrice}</span>
          ) : null}
        </p>
        <p className="text-[11px] font-bold text-delivery">{delivery}</p>
      </div>
    </article>
  );
}
