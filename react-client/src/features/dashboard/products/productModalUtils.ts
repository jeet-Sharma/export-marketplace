/**
 * Helpers shared by the add/edit product modal for mapping API product
 * fields to form values and back — kept out of the UI file so the same
 * parsing rules can't drift between create and update paths.
 */

/** Parse the free-text dutiesTaxesNote back into the three cost inputs. */
export function parseDutiesTaxesNote(note: string | null | undefined) {
  return {
    shipping: note?.match(/Shipping est\.\s*([\d.]+)/i)?.[1] ?? "",
    duties: note?.match(/Duties est\.\s*([\d.]+)/i)?.[1] ?? "",
    taxes: note?.match(/Taxes est\.\s*([\d.]+)/i)?.[1] ?? "",
  };
}

/** Whole months from today until an ISO date (for the Expiry input). */
export function monthsUntilIsoDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) return "";
  const now = new Date();
  const months =
    (target.getUTCFullYear() - now.getUTCFullYear()) * 12 +
    (target.getUTCMonth() - now.getUTCMonth());
  return months > 0 ? String(months) : "";
}

/** Converts whole months from today into YYYY-MM-DD for Create/Update DTOs. */
export function monthsFromNowToIsoDate(months: number): string {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

/**
 * Resolve expiry for save.
 * If the user did not change the months field on edit, keep the original
 * calendar date — recomputing from "months from now" would drift the date
 * on every save.
 */
export function resolveExpiryDate(options: {
  expiryMonths: string;
  initialExpiryDate?: string | null;
}): string | undefined {
  const trimmed = options.expiryMonths.trim();
  const parsed = Number(trimmed);
  if (!trimmed || !Number.isFinite(parsed)) return undefined;

  const initial = options.initialExpiryDate ?? null;
  if (initial && monthsUntilIsoDate(initial) === trimmed) {
    return initial.slice(0, 10);
  }
  return monthsFromNowToIsoDate(parsed);
}

export function messageFromUnknown(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "data" in err) {
    const data = (err as { data?: { message?: string | string[] } }).data;
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (Array.isArray(data?.message) && data.message.length > 0) {
      return data.message.join(", ");
    }
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return fallback;
}
