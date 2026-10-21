/**
 * AccessibleDialog — a shared WAI-ARIA-compliant modal wrapper.
 *
 * Responsibilities:
 *  - Moves focus into the dialog on mount (first focusable descendant or the
 *    panel itself as a fallback) and returns it to the previously-focused
 *    element on unmount.
 *  - Traps Tab / Shift+Tab so keyboard focus cannot reach the covered page.
 *  - Closes on Escape.
 *  - Locks body scroll while open (adds overflow:hidden, restores on unmount).
 *  - Closes when the backdrop overlay is clicked directly.
 *
 * Usage:
 *   <AccessibleDialog labelId={headingId} onClose={onClose}>
 *     <h2 id={headingId}>…</h2>
 *     …panel content…
 *   </AccessibleDialog>
 */

import { useEffect, useRef, type ReactNode } from "react";

const FOCUSABLE =
  'a[href],area[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"])';

interface AccessibleDialogProps {
  /** id of the element that labels this dialog (wired to aria-labelledby). */
  labelId: string;
  onClose: () => void;
  /** Overlay + panel wrapper className — defaults to a centred fixed overlay. */
  overlayClassName?: string;
  children: ReactNode;
}

export function AccessibleDialog({
  labelId,
  onClose,
  overlayClassName,
  children,
}: AccessibleDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Focus management ───────────────────────────────────────────────────────
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus into the dialog: first tabbable child, or the panel itself.
    const panel = panelRef.current;
    if (panel) {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    }

    return () => {
      // Return focus to the element that was active before the dialog opened.
      previouslyFocused?.focus();
    };
  }, []);

  // ── Body-scroll lock ───────────────────────────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ── Keyboard handling ──────────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }

    if (e.key !== "Tab") return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift+Tab: if focus is on the first element, wrap to last.
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: if focus is on the last element, wrap to first.
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  return (
    <div
      className={
        overlayClassName ??
        "fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#35101f]/60 p-4"
      }
      onClick={(e) => {
        // Close only when the backdrop itself (not a child) is clicked.
        if (e.target === e.currentTarget) onClose();
      }}
      // The overlay is purely presentational; the inner panel carries the role.
      aria-hidden={false}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        // tabIndex={-1} makes the panel focusable as a fallback when there are
        // no interactive children, without putting it in the natural tab order.
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="flex max-h-[90vh] w-[min(800px,100%)] flex-col overflow-hidden rounded-[18px] border border-[#eee9e4] bg-bloom-card shadow-[0px_18px_48px_-12px_rgba(53,16,31,0.12)] outline-none"
      >
        {children}
      </div>
    </div>
  );
}
