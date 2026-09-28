import { routes } from "@/config/routes";
import type { AuthenticatedUser, UserType } from "@/types/auth";

// Post-login routing + account-status gating. Kept as pure functions (like
// getProductById in lib/products.ts) so the login page/form stay dumb
// about business rules — when a real auth API exists, only the caller of
// these functions changes, not the functions themselves.

/**
 * Where a signed-in user lands, based on `user_type` (Data_Modeling_2.md
 * 2.5): PLATFORM and VENDOR both open a panel under /vendor today (the
 * vendor dashboard shell is the only internal panel built so far); BUYER
 * has no dashboard yet, so they land back on the public storefront.
 */
export function resolvePostLoginRoute(userType: UserType): string {
  if (userType === "PLATFORM" || userType === "VENDOR") {
    return routes.vendorDashboard;
  }
  return routes.home;
}

/**
 * Returns a user-facing message if `status` should block login, or `null`
 * if the account is allowed to sign in. Mirrors users.status from the data
 * model: PENDING (email not verified yet), BLOCKED (suspended by an
 * admin) and ANONYMISED (erased account) all refuse login; only ACTIVE
 * proceeds.
 */
export function getLoginBlockReason(status: AuthenticatedUser["status"]): string | null {
  if (status === "PENDING") {
    return "Please verify your email address before signing in.";
  }
  if (status === "BLOCKED") {
    return "This account has been blocked. Contact support for help.";
  }
  if (status === "ANONYMISED") {
    return "This account no longer exists.";
  }
  return null;
}

/**
 * Where a visitor goes right after submitting the signup form. This form
 * always creates a BUYER account (see types/auth.ts SignupFormValues), and
 * per users.status (Data_Modeling_2.md 2.5) a freshly created account
 * starts as PENDING with email_verified = false, so signup doesn't log
 * the visitor in — it sends them to login to wait for verification.
 * Vendor onboarding remains a separate existing flow at /sell-with-us.
 */
export function resolvePostSignupRoute(): string {
  return routes.login;
}
