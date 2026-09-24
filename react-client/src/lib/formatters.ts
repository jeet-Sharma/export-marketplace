// Shared formatting helpers so seed data (and later, real API data) can stay
// numeric/raw and components decide how to display it, instead of baking
// pre-formatted strings ("$24,680") into the data itself.
import type { StatFormat, StatTrend } from "@/types/stats";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatStatValue(value: number, format: StatFormat = "number"): string {
  if (format === "currency") return currencyFormatter.format(value);
  if (format === "percent") return `${value}%`;
  if (format === "number") return numberFormatter.format(value);
  return String(value);
}

// Renders a signed delta like "+12%" or "-3%" from a raw numeric delta.
// Returns null if delta is null/undefined so callers can skip the row.
export function formatDelta(
  delta: number | null | undefined,
  format: StatFormat = "percent",
): string | null {
  if (delta === null || delta === undefined) return null;
  const sign = delta > 0 ? "+" : "";
  if (format === "percent") return `${sign}${delta}%`;
  if (format === "currency") return `${sign}${currencyFormatter.format(delta)}`;
  return `${sign}${numberFormatter.format(delta)}`;
}

// Derives up/down/neutral from a signed numeric delta so seed data doesn't
// need to declare `trend` redundantly alongside `delta`.
export function trendFromDelta(delta: number | null | undefined): StatTrend {
  if (delta === null || delta === undefined || delta === 0) return "neutral";
  return delta > 0 ? "up" : "down";
}
