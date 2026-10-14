import type { DashboardRole } from "./navConfig";

const VALID_ROLES: readonly DashboardRole[] = ["admin", "vendor", "user"];

/**
 * Resolve a dashboard role from an untrusted URL searchParam value.
 * Falls back to "admin" so the route always renders a valid workspace.
 * This is view-only role switching for the demo — real role resolution
 * will come from the authenticated session, never from a client param.
 */
export function resolveRole(value: string | string[] | undefined): DashboardRole {
  const raw = Array.isArray(value) ? value[0] : value;
  return VALID_ROLES.includes(raw as DashboardRole)
    ? (raw as DashboardRole)
    : "admin";
}
