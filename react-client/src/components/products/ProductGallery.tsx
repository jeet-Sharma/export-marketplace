"use client";

import { useState, useRef } from "react";
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

/**
 * Lens crosshair dimensions + position, derived purely from state values —
 * safe to compute during render because no ref is read here.
 */
interface LensGeometry {
  lensW: number;
  lensH: number;
  lensLeft: number;
  lensTop: number;
}

interface LensState {
  active: boolean;
  xFrac: number;
  yFrac: number;
  /** Snapshot of the image frame rect, captured on mouseenter and stored in
   *  state so it is safe to read during render (refs must not be read in the
   *  render phase per the react-hooks/refs rule). */
  frameW: number;
  frameH: number;
}

const LENS_INACTIVE: LensState = {
  active: false,
  xFrac: 0.5,
  yFrac: 0.5,
  frameW: 0,
  frameH: 0,
};

/** Compute lens overlay geometry from the current lens state. Pure function — no refs. */
function computeLens(lens: LensState): LensGeometry {
  if (!lens.active || lens.frameW === 0 || lens.frameH === 0) {
    return { lensW: 0, lensH: 0, lensLeft: 0, lensTop: 0 };
  }
  const bgW = lens.frameW * ZOOM_FACTOR;
  const bgH = lens.frameH * ZOOM_FACTOR;
  const panelSize = lens.frameH;
  const lensW = (panelSize / bgW) * lens.frameW;
  const lensH = (panelSize / bgH) * lens.frameH;
  const lensLeft = Math.max(0, Math.min(lens.frameW - lensW, lens.xFrac * lens.frameW - lensW / 2));
  const lensTop  = Math.max(0, Math.min(lens.frameH - lensH, lens.yFrac * lens.frameH - lensH / 2));
  return { lensW, lensH, lensLeft, lensTop };
}

/**
 * Product image gallery with Amazon-style mouse-tracking zoom.
 *
 * - Thumbnails are 88 px, scale up on hover, and glow pink when active.
 * - The lens crosshair is a frosted "window" with corner bracket handles.
 * - A "Move to zoom" hint pill fades in briefly on first hover.
 * - frameRect dimensions are stored in state (not a ref) so they are safe
 *   to read during render — this satisfies the react-hooks/refs rule.
 * - useCallback is omitted intentionally: the React Compiler handles
 *   memoization automatically, and manual useCallback with deps the compiler
 *   cannot verify causes the preserve-manual-memoization error.
 *
 * Touch / coarse-pointer: .zoom-lens is hidden via @media (pointer: coarse)
 * in globals.css; the purchase panel stays visible on mobile.
 */
export function ProductGallery({ images, productName, onZoomChange }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex];
  const imageUrl = active?.url ?? PLACEHOLDER_IMAGE;

  const [lens, setLens] = useState<LensState>(LENS_INACTIVE);
  const [showHint, setShowHint] = useState(false);
  // hintTimer only lives in a ref — it is a side-effect handle, never read
  // during render, so a ref is the correct tool here.
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helper: compute zoom props and notify parent ────────────────────────
  // Plain function (not useCallback) — the React Compiler will memoize this.
  function emitZoom(xFrac: number, yFrac: number, frameW: number, frameH: number) {
    if (!onZoomChange || frameW === 0 || frameH === 0) return;
    const bgW = frameW * ZOOM_FACTOR;
    const bgH = frameH * ZOOM_FACTOR;
    const panelSize = frameH;
    const bpX = Math.max(0, Math.min(bgW - panelSize, xFrac * bgW - panelSize / 2));
    const bpY = Math.max(0, Math.min(bgH - panelSize, yFrac * bgH - panelSize / 2));
    onZoomChange(true, { imageUrl, bgW, bgH, bpX, bpY });
  }

  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>) {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const xFrac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const yFrac = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setLens({ active: true, xFrac, yFrac, frameW: rect.width, frameH: rect.height });
    emitZoom(xFrac, yFrac, rect.width, rect.height);
    setShowHint(true);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setShowHint(false), 1600);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    // frameW/frameH are already in state from mouseenter — read them there,
    // not from a ref, to stay compliant with react-hooks/refs.
    if (!lens.active || lens.frameW === 0) return;
    const xFrac = Math.max(0, Math.min(1, (e.clientX - e.currentTarget.getBoundingClientRect().left) / lens.frameW));
    const yFrac = Math.max(0, Math.min(1, (e.clientY - e.currentTarget.getBoundingClientRect().top) / lens.frameH));
    setLens((prev) => ({ ...prev, xFrac, yFrac }));
    emitZoom(xFrac, yFrac, lens.frameW, lens.frameH);
  }

  function handleMouseLeave() {
    setLens(LENS_INACTIVE);
    setShowHint(false);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    onZoomChange?.(false, null);
  }

  function handleThumbnailClick(index: number) {
    setActiveIndex(index);
    setLens(LENS_INACTIVE);
    setShowHint(false);
    onZoomChange?.(false, null);
  }

  // ── Lens crosshair geometry — derived from state, no refs ───────────────
  const { lensW, lensH, lensLeft, lensTop } = computeLens(lens);

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
                  // Presigned S3/LocalStack URLs have a short-lived signature —
                  // bypassing the optimizer prevents caching an expiring URL.
                  unoptimized
                />
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

        {/* ── Lens crosshair overlay ── */}
        {lens.active ? (
          <div
            aria-hidden
            className="zoom-lens pointer-events-none absolute"
            style={{ left: lensLeft, top: lensTop, width: lensW, height: lensH }}
          >
            {/* Frosted fill */}
            <div className="absolute inset-0 rounded-[6px] bg-white/20 backdrop-blur-[1.5px]" />
            {/* Solid pink border + inner highlight */}
            <div className="absolute inset-0 rounded-[6px] border-2 border-pink shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,0.6)]" />
            {/* Corner bracket handles */}
            <span className="absolute left-0 top-0 h-[10px] w-[10px] rounded-tl-[4px] border-l-[3px] border-t-[3px] border-pink" />
            <span className="absolute right-0 top-0 h-[10px] w-[10px] rounded-tr-[4px] border-r-[3px] border-t-[3px] border-pink" />
            <span className="absolute bottom-0 left-0 h-[10px] w-[10px] rounded-bl-[4px] border-b-[3px] border-l-[3px] border-pink" />
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
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
            <circle cx="4.5" cy="4.5" r="3.5" stroke="white" strokeWidth="1.4" />
            <line x1="7.4" y1="7.4" x2="10" y2="10" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Move to zoom
        </div>

        {/* Image counter badge */}
        {sorted.length > 1 ? (
          <span className="absolute bottom-4 right-4 rounded-full bg-pink/90 px-[10px] py-[5px] text-[11px] font-bold text-white shadow-[0px_2px_8px_rgba(217,66,114,0.35)] backdrop-blur-sm">
            {activeIndex + 1} / {sorted.length}
          </span>
        ) : null}
      </div>
    </div>
  );
}
