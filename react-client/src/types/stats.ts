// Shared shape for every "stat card" row across the vendor dashboard,
// analytics, orders, inventory, RFQ and documents screens. Kept in one
// place because StatCard/StatRow render all of them identically — see
// src/lib/formatters.ts for how `format`/`delta` are turned into display
// strings.

/** How a stat's raw numeric `value` (and `delta`) should be displayed. */
export type StatFormat = "number" | "currency" | "percent";

/** Up/down/neutral indicator shown next to a stat's delta. */
export type StatTrend = "up" | "down" | "neutral";

export interface StatCardData {
  id: string;
  label: string;
  value: number;
  format: StatFormat;
  /**
   * Raw signed change since the previous period. `null` when the stat has
   * no meaningful delta (e.g. a note-only row) — see `note` below.
   */
  delta: number | null;
  /** Overrides the format used to render `delta`, when it differs from `format`. */
  deltaFormat?: StatFormat;
  /**
   * Overrides the trend derived from `delta`'s sign. Only needed for rows
   * where `delta` is null but a trend still applies (e.g. "3 docs missing").
   */
  trend?: StatTrend;
  /** Plain-text annotation shown instead of, or alongside, a numeric delta. */
  note?: string;
}
