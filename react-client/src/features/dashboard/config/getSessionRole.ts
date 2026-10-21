import { cookies } from "next/headers";

/**
 * Read the first role code from the `user_data` cookie set at login.
 * Used by dashboard server pages so /dashboard and /dashboard/products
 * resolve the same workspace without a `?role=` query.
 */
export async function getSessionRole(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const rawUserData = cookieStore.get("user_data")?.value;
  if (!rawUserData) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(rawUserData) as { roles?: unknown };
    const first = Array.isArray(parsed.roles) ? parsed.roles[0] : undefined;
    return typeof first === "string" ? first : undefined;
  } catch {
    return undefined;
  }
}
