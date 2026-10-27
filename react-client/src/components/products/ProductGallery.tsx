"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import type { ApiProductImage } from "@/features/products/types/product-api.types";

const PLACEHOLDER_IMAGE = "/marketplace/product-1.png";

/** Magnification factor for the zoom result panel. */
const ZOOM_FACTOR = 2.5;

interface ProductGalleryProps {
  images: ApiProductImage[];
  productName: string;
  /**
   * Fired on every mousemove/mouseenter/mouseleave over the featured image.
   * The parent (ProductDetailView) uses this to swap its purchase panel for
   * the inline zoom result while the cursor is on the image.
   */
  onZoomChange?: (active: boolean, zoomProps: ZoomPanelProps | null) => void;
}

/** Geometry the parent needs to render the zoom result panel. */
export interface ZoomPanelProps {
  imageUrl: string;
  bgW: number;
  bgH: number;
  bpX: number;
  bpY: number;
}

interface LensState {
  active: boolean;
  xFrac: number;
  yFrac: number;
}

/**
 * Product image gallery with Amazon-style mouse-tracking zoom.
 *
 * UI improvements over the initial implementation:
 * - Thumbnails are larger (88 px), scale up on hover, and glow pink when active.
 * - The lens crosshair reads as a clean frosted "window" with a solid pink
 *   border and corner handles rather than a plain blurred rectangle.
 * - A "Move to zoom" hint pill fades in when the user first hovers the image
 *   and fades away after 1.6 s so it never gets in the way.
 * - The image counter badge uses the brand pink tint.
 *
 * frameRect is stored in a ref (not state) so mousemove handlers always read
 * a fresh value without triggering extra renders or stale closures.
 * onZoomChange is called directly from event handlers — never inside a
 * setState updater — avoiding the "setState during render" violation.
 *
 * Touch / coarse-pointer: .zoom-lens is hidden via @media (pointer: coarse)
 * in globals.css; the purchase panel stays visible on mobile.
 */
export function ProductGallery({ images, productName, onZoomChange }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex];
  const imageUrl = active?.url ?? PLACEHOLDER_IMAGE;

  const frameRectRef = useRef<DOMRect | null>(null);
  const [lens, setLens] = useState<LensState>({ active: false, xFrac: 0.5, yFrac: 0.5 });
  // Controls the "Move to zoom" hint — shown briefly on first hover.
  const [showHint, setShowHint] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Zoom geometry → parent notification ────────────────────────────────
  const emitZoom = useCallback(
    (xFrac: number, yFrac: number) => {
      if (!onZoomChange) return;
      const fr = frameRectRef.current;
      if (!fr) return;
      const bgW = fr.width * ZOOM_FACTOR;
      const bgH = fr.height * ZOOM_FACTOR;
      const panelSize = fr.height;
      const bpX = Math.max(0, Math.min(bgW - panelSize, xFrac * bgW - panelSize / 2));
      const bpY = Math.max(0, Math.min(bgH - panelSize, yFrac * bgH - panelSize / 2));
      onZoomChange(true, { imageUrl, bgW, bgH, bpX, bpY });
    },
    [onZoomChange, imageUrl],
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
      frameRectRef.current = rect;
      const xFrac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const yFrac = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      setLens({ active: true, xFrac, yFrac });
      emitZoom(xFrac, yFrac);
      // Show hint briefly on enter then auto-hide.
      setShowHint(true);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => setShowHint(false), 1600);
    },
    [emitZoom],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const fr = frameRectRef.current;
      if (!fr) return;
      const xFrac = Math.max(0, Math.min(1, (e.clientX - fr.left) / fr.width));
      const yFrac = Math.max(0, Math.min(1, (e.clientY - fr.top) / fr.height));
      setLens({ active: true, xFrac, yFrac });
      emitZoom(xFrac, yFrac);
    },
    [emitZoom],
  );

  const handleMouseLeave = useCallback(() => {
    frameRectRef.current = null;
    setLens({ active: false, xFrac: 0.5, yFrac: 0.5 });
    setShowHint(false);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    onZoomChange?.(false, null);
  }, [onZoomChange]);

  const handleThumbnailClick = useCallback(
    (index: number) => {
      setActiveIndex(index);
      frameRectRef.current = null;
      setLens({ active: false, xFrac: 0.5, yFrac: 0.5 });
      setShowHint(false);
      onZoomChange?.(false, null);
    },
    [onZoomChange],
  );

  // ── Lens crosshair geometry ─────────────────────────────────────────────
  const fr = frameRectRef.current;
  const bgW = fr ? fr.width * ZOOM_FACTOR : 0;
  const bgH = fr ? fr.height * ZOOM_FACTOR : 0;
  const panelSize = fr ? fr.height : 0;
  const lensW = fr && bgW > 0 ? (panelSize / bgW) * fr.width : 0;
  const lensH = fr && bgH > 0 ? (panelSize / bgH) * fr.height : 0;
  const lensLeft = fr ? Math.max(0, Math.min(fr.width - lensW, lens.xFrac * fr.width - lensW / 2)) : 0;
  const lensTop  = fr ? Math.max(0, Math.min(fr.height - lensH, lens.yFrac * fr.height - lensH / 2)) : 0;

  return (
    <div className="flex w-full gap-3">

      {/* ── Thumbnail strip ─────────────────────────────────────────────── */}
      {sorted.length > 0 ? (
        <div className="flex shrink-0 flex-col gap-[8px]">
          {sorted.map((image, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => handleThumbnailClick(index)}
                aria-label={`Show image ${index + 1} of ${sorted.length}`}
                aria-current={isActive}
                className={[
                  "relative size-[88px] overflow-hidden rounded-[12px] border-2 bg-white",
                  "transition-all duration-200",
                  isActive
                    ? "border-pink scale-[1.04] shadow-[0px_0px_0px_3px_rgba(217,66,114,0.18)]"
                    : "border-border hover:border-pink/50 hover:scale-[1.03] hover:shadow-[0px_4px_12px_rgba(17,24,39,0.12)]",
                ].join(" ")}
              >
                <Image
                  src={image.url}
                  alt={image.altText ?? `${productName} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {/* Active indicator dot */}
                {isActive ? (
                  <span
                    aria-hidden
                    className="absolute bottom-[5px] left-1/2 size-[5px] -translate-x-1/2 rounded-full bg-pink"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* ── Main featured image frame ───────────────────────────────────── */}
      <div
        className="relative h-[560px] flex-1 overflow-hidden rounded-[16px] bg-white ring-1 ring-border transition-shadow duration-200"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onDragStart={(e) => e.preventDefault()}
        style={{ cursor: lens.active ? "none" : "default" }}
      >
        <Image
          src={imageUrl}
          alt={active?.altText ?? productName}
          fill
          className="object-cover"
          priority
          unoptimized
        />

        {/* ── Lens crosshair ── */}
        {lens.active && fr ? (
          <div
            aria-hidden
            className="zoom-lens pointer-events-none absolute"
            style={{
              left: lensLeft,
              top: lensTop,
              width: lensW,
              height: lensH,
            }}
          >
            {/* Frosted fill */}
            <div className="absolute inset-0 rounded-[6px] bg-white/20 backdrop-blur-[1.5px]" />
            {/* Solid pink border */}
            <div className="absolute inset-0 rounded-[6px] border-2 border-pink shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,0.6)]" />
            {/* Corner handles — top-left */}
            <span className="absolute left-0 top-0 h-[10px] w-[10px] rounded-tl-[4px] border-l-[3px] border-t-[3px] border-pink" />
            {/* top-right */}
            <span className="absolute right-0 top-0 h-[10px] w-[10px] rounded-tr-[4px] border-r-[3px] border-t-[3px] border-pink" />
            {/* bottom-left */}
            <span className="absolute bottom-0 left-0 h-[10px] w-[10px] rounded-bl-[4px] border-b-[3px] border-l-[3px] border-pink" />
            {/* bottom-right */}
            <span className="absolute bottom-0 right-0 h-[10px] w-[10px] rounded-br-[4px] border-b-[3px] border-r-[3px] border-pink" />
          </div>
        ) : null}

        {/* ── "Move to zoom" hint pill ── */}
        <div
          aria-hidden
          className={[
            "zoom-lens pointer-events-none absolute left-1/2 top-4 -translate-x-1/2",
            "flex items-center gap-[5px] rounded-full bg-ink/75 px-[11px] py-[5px]",
            "text-[11px] font-semibold text-white backdrop-blur-sm",
            "transition-all duration-300",
            showHint ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1",
          ].join(" ")}
        >
          {/* magnifier icon */}
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
            <circle cx="4.5" cy="4.5" r="3.5" stroke="white" strokeWidth="1.4" />
            <line x1="7.4" y1="7.4" x2="10" y2="10" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Move to zoom
        </div>

        {/* Image counter */}
        {sorted.length > 1 ? (
          <span className="absolute bottom-4 right-4 rounded-full bg-pink/90 px-[10px] py-[5px] text-[11px] font-bold text-white shadow-[0px_2px_8px_rgba(217,66,114,0.35)] backdrop-blur-sm">
            {activeIndex + 1} / {sorted.length}
          </span>
        ) : null}
      </div>
    </div>
  );
}
