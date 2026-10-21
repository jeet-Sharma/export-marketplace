import type { DashboardRole } from "./navConfig";

const VALID_ROLES: readonly DashboardRole[] = ["admin", "vendor", "user"];

/**
 * Map a URL `?role=` value or a backend role code (e.g. PLATFORM_ADMIN)
 * onto the dashboard workspace keys.
 */
export function resolveRole(
  value: string | string[] | undefined,
): DashboardRole {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase();
  if (!raw) {
    return "admin";
  }
  if (VALID_ROLES.includes(raw as DashboardRole)) {
    return raw as DashboardRole;
  }
  if (raw === "buyer") {
    return "user";
  }
  if (raw.includes("vendor")) {
    return "vendor";
  }
  if (raw.includes("admin")) {
    return "admin";
  }
  return "admin";
}
