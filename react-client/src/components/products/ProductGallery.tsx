"use client";

import { useState, useRef, useEffect } from "react";
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
  frameW: number;
  frameH: number;
}

/** Natural pixel dimensions of the loaded image. null = not yet loaded. */
interface NaturalSize {
  w: number;
  h: number;
}

const LENS_INACTIVE: LensState = {
  active: false,
  xFrac: 0.5,
  yFrac: 0.5,
  frameW: 0,
  frameH: 0,
};

/**
 * Returns true only when the primary pointer is fine (mouse/trackpad).
 * Checked at event time so tablets that switch pointer types mid-session
 * are handled correctly, and so zoom is never activated on coarse-pointer
 * devices even if they also have a connected mouse that fires mouseenter.
 */
function isPointerFine(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: fine)").matches;
}

/**
 * Replicate CSS object-cover: find the scale factor that makes the image
 * fill the frame (shorter dimension wins), then compute the symmetric crop
 * offsets. Returns the rendered image size and how much is cropped off each
 * edge.
 *
 * This is needed so the zoom background-position matches exactly what the
 * cursor is hovering over in the frame — without this correction, zoom
 * distorts non-square images and tracks the wrong region.
 */
function objectCoverCrop(
  natW: number,
  natH: number,
  frameW: number,
  frameH: number,
): { scale: number; cropX: number; cropY: number; renderedW: number; renderedH: number } {
  const scale = Math.max(frameW / natW, frameH / natH);
  const renderedW = natW * scale;
  const renderedH = natH * scale;
  const cropX = (renderedW - frameW) / 2;
  const cropY = (renderedH - frameH) / 2;
  return { scale, cropX, cropY, renderedW, renderedH };
}

/**
 * Compute zoom background-size and background-position that exactly match
 * the object-cover crop of the featured image.
 *
 * Steps:
 *  1. Replicate the object-cover scale + crop offsets from natural dimensions.
 *  2. Scale the full natural image by ZOOM_FACTOR for the background-size
 *     (no distortion — aspect ratio is preserved).
 *  3. Map the cursor fraction through the crop rect to find the pixel in the
 *     rendered (cover-scaled) image, then multiply by ZOOM_FACTOR for the
 *     background-position offset, centering the panel on that point.
 */
function computeZoomGeometry(
  xFrac: number,
  yFrac: number,
  frameW: number,
  frameH: number,
  nat: NaturalSize,
  panelSize: number,
): { bgW: number; bgH: number; bpX: number; bpY: number } {
  const { scale, cropX, cropY } = objectCoverCrop(nat.w, nat.h, frameW, frameH);

  // Pixel position in the rendered (cover-scaled) image that the cursor is over.
  const cursorRenderedX = xFrac * frameW + cropX;
  const cursorRenderedY = yFrac * frameH + cropY;

  // Background size: natural dims × ZOOM_FACTOR (preserves aspect ratio).
  const bgW = nat.w * scale * ZOOM_FACTOR;
  const bgH = nat.h * scale * ZOOM_FACTOR;

  // Background position: shift so cursorRenderedX*ZOOM_FACTOR lands at panel centre.
  const bpX = Math.max(0, Math.min(bgW - panelSize, cursorRenderedX * ZOOM_FACTOR - panelSize / 2));
  const bpY = Math.max(0, Math.min(bgH - panelSize, cursorRenderedY * ZOOM_FACTOR - panelSize / 2));

  return { bgW, bgH, bpX, bpY };
}

/**
 * Compute the lens crosshair size and position so it represents the area
 * of the object-cover image that the zoom panel is showing.
 *
 * The lens covers (panelSize / bgW) × frameW pixels of the frame — i.e.
 * the fraction of the rendered image visible in the panel.
 */
function computeLens(
  lens: LensState,
  nat: NaturalSize | null,
  panelSize: number,
): LensGeometry {
  if (!lens.active || lens.frameW === 0 || lens.frameH === 0 || !nat) {
    return { lensW: 0, lensH: 0, lensLeft: 0, lensTop: 0 };
  }

  const { scale, cropX, cropY } = objectCoverCrop(nat.w, nat.h, lens.frameW, lens.frameH);
  const bgW = nat.w * scale * ZOOM_FACTOR;
  const bgH = nat.h * scale * ZOOM_FACTOR;

  // How much of the rendered image is visible in the panel, mapped back to frame pixels.
  const lensW = Math.min(lens.frameW, (panelSize / bgW) * (nat.w * scale - cropX * 2) * (lens.frameW / (lens.frameW)));
  const lensH = Math.min(lens.frameH, (panelSize / bgH) * (nat.h * scale - cropY * 2) * (lens.frameH / (lens.frameH)));

  // Simpler equivalent: panel covers panelSize px of the ZOOM_FACTOR-scaled render.
  // That maps back to panelSize/ZOOM_FACTOR px of the cover-scaled render,
  // which maps to (panelSize/ZOOM_FACTOR / scale) / natW * frameW px of the frame.
  const lensWFrame = (panelSize / ZOOM_FACTOR / scale / nat.w) * lens.frameW;
  const lensHFrame = (panelSize / ZOOM_FACTOR / scale / nat.h) * lens.frameH;
  const clampedLensW = Math.min(lens.frameW, lensWFrame);
  const clampedLensH = Math.min(lens.frameH, lensHFrame);

  void lensW; void lensH; // suppress unused-var — using the cleaner derivation below

  const lensLeft = Math.max(0, Math.min(lens.frameW - clampedLensW, lens.xFrac * lens.frameW - clampedLensW / 2));
  const lensTop  = Math.max(0, Math.min(lens.frameH - clampedLensH, lens.yFrac * lens.frameH - clampedLensH / 2));

  return { lensW: clampedLensW, lensH: clampedLensH, lensLeft, lensTop };
}

/**
 * Product image gallery with Amazon-style mouse-tracking zoom.
 *
 * Zoom correctness: the zoom panel replicates CSS object-cover geometry —
 * it derives the background-size from the image's natural dimensions (not
 * the frame dimensions), then maps the cursor through the same crop that
 * object-cover applies. This prevents the distortion and mis-tracking that
 * occurred when non-square images were stretched to frame × ZOOM_FACTOR.
 *
 * Natural dimensions are loaded once per active image via a hidden Image()
 * preload (useEffect, keyed by URL) and stored in state so they are
 * render-safe (no ref reads during render).
 */
export function ProductGallery({ images, productName, onZoomChange }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex];
  const imageUrl = active?.url ?? PLACEHOLDER_IMAGE;

  const [lens, setLens] = useState<LensState>(LENS_INACTIVE);
  const [showHint, setShowHint] = useState(false);
  const [naturalSize, setNaturalSize] = useState<NaturalSize | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load natural image dimensions whenever the active image changes.
  // Stored in state (not a ref) so they are safe to use during render.
  //
  // setState is only ever called from within the async callbacks (onload /
  // onerror), never synchronously in the effect body — the rule
  // react-hooks/set-state-in-effect flags synchronous setState as a
  // cascading-render risk. The cancelled flag prevents a stale callback from
  // a previous image from overwriting state after the effect has re-run.
  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = () => {
      if (!cancelled) setNaturalSize(null);
    };
    img.src = imageUrl;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  // Panel size: matches the gallery frame height (560px) so the zoom panel
  // fills the purchase-card slot height. Stored as a constant here; the
  // parent renders the panel at this height.
  const PANEL_SIZE = 560;

  function emitZoom(xFrac: number, yFrac: number, frameW: number, frameH: number) {
    if (!onZoomChange || frameW === 0 || frameH === 0 || !naturalSize) return;
    const { bgW, bgH, bpX, bpY } = computeZoomGeometry(
      xFrac, yFrac, frameW, frameH, naturalSize, PANEL_SIZE,
    );
    onZoomChange(true, { imageUrl, bgW, bgH, bpX, bpY });
  }

  function handleMouseEnter(e: React.MouseEvent<HTMLDivElement>) {
    if (!isPointerFine()) return;
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
    if (!isPointerFine() || !lens.active || lens.frameW === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xFrac = Math.max(0, Math.min(1, (e.clientX - rect.left) / lens.frameW));
    const yFrac = Math.max(0, Math.min(1, (e.clientY - rect.top) / lens.frameH));
    setLens((prev) => ({ ...prev, xFrac, yFrac }));
    emitZoom(xFrac, yFrac, lens.frameW, lens.frameH);
  }

  function handleMouseLeave() {
    if (!isPointerFine()) return;
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

  const { lensW, lensH, lensLeft, lensTop } = computeLens(lens, naturalSize, PANEL_SIZE);

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

        {/* Lens crosshair — only shown once natural size is loaded so geometry is correct */}
        {lens.active && naturalSize ? (
          <div
            aria-hidden
            className="zoom-lens pointer-events-none absolute"
            style={{ left: lensLeft, top: lensTop, width: lensW, height: lensH }}
          >
            <div className="absolute inset-0 rounded-[6px] bg-white/20 backdrop-blur-[1.5px]" />
            <div className="absolute inset-0 rounded-[6px] border-2 border-pink shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,0.6)]" />
            <span className="absolute left-0 top-0 h-[10px] w-[10px] rounded-tl-[4px] border-l-[3px] border-t-[3px] border-pink" />
            <span className="absolute right-0 top-0 h-[10px] w-[10px] rounded-tr-[4px] border-r-[3px] border-t-[3px] border-pink" />
            <span className="absolute bottom-0 left-0 h-[10px] w-[10px] rounded-bl-[4px] border-b-[3px] border-l-[3px] border-pink" />
            <span className="absolute bottom-0 right-0 h-[10px] w-[10px] rounded-br-[4px] border-b-[3px] border-r-[3px] border-pink" />
          </div>
        ) : null}

        {/* "Move to zoom" hint pill */}
        <div
          aria-hidden
          className={[
            "zoom-lens pointer-events-none absolute left-1/2 top-4 -translate-x-1/2",
            "flex items-center gap-[5px] rounded-full bg-ink/75 px-[11px] py-[5px]",
            "text-[11px] font-semibold text-white backdrop-blur-sm transition-all duration-300",
            showHint ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1",
          ].join(" ")}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
            <circle cx="4.5" cy="4.5" r="3.5" stroke="white" strokeWidth="1.4" />
            <line x1="7.4" y1="7.4" x2="10" y2="10" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Move to zoom
        </div>

        {sorted.length > 1 ? (
          <span className="absolute bottom-4 right-4 rounded-full bg-pink/90 px-[10px] py-[5px] text-[11px] font-bold text-white shadow-[0px_2px_8px_rgba(217,66,114,0.35)] backdrop-blur-sm">
            {activeIndex + 1} / {sorted.length}
          </span>
        ) : null}
      </div>
    </div>
  );
}
