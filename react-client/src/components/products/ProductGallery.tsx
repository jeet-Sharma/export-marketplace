"use client";

import { useState } from "react";
import Image from "next/image";
import type { ApiProductImage } from "@/features/products/types/product-api.types";

const PLACEHOLDER_IMAGE = "/marketplace/product-1.png";

interface ProductGalleryProps {
  images: ApiProductImage[];
  productName: string;
}

/**
 * Product image gallery: a left-side thumbnail column plus a large
 * featured image, matching the Figma gallery layout. The thumbnail column
 * only renders when there's more than one image (a single-image product
 * just shows the featured frame) — never fabricated placeholder
 * thumbnails for images that don't exist.
 */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex];

  return (
    <div className="flex w-full gap-3">
      {sorted.length > 1 ? (
        <div className="flex shrink-0 flex-col gap-[10px]">
          {sorted.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show image ${index + 1} of ${sorted.length}`}
              aria-current={index === activeIndex}
              className={`relative size-[76px] overflow-hidden rounded-[10px] border-2 bg-white transition-colors ${
                index === activeIndex ? "border-pink" : "border-border hover:border-pink/40"
              }`}
            >
              <Image
                src={image.url}
                alt={image.altText ?? `${productName} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                // Presigned S3/LocalStack URLs contain a short-lived signature
                // in the query string. The next/image optimizer would cache the
                // full URL (including the expiring params), turning it into a
                // 403 once the signature expires. Bypass the optimizer so every
                // request fetches a fresh signed URL from S3.
                unoptimized
              />
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative h-[420px] flex-1 overflow-hidden rounded-[16px] bg-white">
        <Image
          src={active?.url ?? PLACEHOLDER_IMAGE}
          alt={active?.altText ?? productName}
          fill
          className="object-cover"
          priority
          // See thumbnail comment above: unoptimized prevents the image
          // optimizer from caching an already-expired presigned S3 signature.
          unoptimized
        />
        {sorted.length > 1 ? (
          <span className="absolute bottom-4 right-4 rounded-full bg-ink/80 px-[10px] py-[7px] text-[12px] font-bold text-white">
            {activeIndex + 1} / {sorted.length}
          </span>
        ) : null}
      </div>
    </div>
  );
}
