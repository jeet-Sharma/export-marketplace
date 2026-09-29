// Shapes mirroring the `users` table in Data_Modeling_2.md (section 2.5).
// Only the fields the login flow actually needs are modeled here — this is
// not a full ORM entity, just what the client needs to authenticate and
// route a signed-in user to their panel.
import type { UserTypeValue } from "@/config/userTypes";

/** `users.user_type` — which panel/dashboard opens by default after login. */
export type UserType = UserTypeValue;

/** `users.auth_provider` — how this account's identity is verified. */
export type AuthProvider = "LOCAL" | "GOOGLE";

/** `users.status` — account lifecycle state. */
export type UserStatus = "PENDING" | "ACTIVE" | "BLOCKED" | "ANONYMISED";

/**
 * The authenticated user shape returned by a successful login. Deliberately
 * narrow (no organization_id, no timestamps) — the login flow only needs
 * enough to decide where to route the user next and what to show them.
 */
export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  userType: UserType;
  authProvider: AuthProvider;
  status: UserStatus;
}

/** Login form field values. */
export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

/** Login form validation errors, keyed by field, plus a form-wide `form` slot
 * for server/auth-level failures (wrong credentials, blocked account, etc)
 * that don't belong to any single field. */
export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>> & {
  form?: string;
};

/**
 * Signup form field values. Always creates a BUYER account
 * (Data_Modeling_2.md 2.5 user_type) — there is no account-type picker on
 * this form. PLATFORM is a single row created once, never through public
 * signup (2.1), and VENDOR onboarding (which also needs organization_id
 * set, legal name, GST, IEC, documents) is its own existing flow at
 * /sell-with-us rather than a branch of this form.
 */
export interface SignupFormValues {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

/** Signup form validation errors, keyed by field, plus a form-wide `form`
 * slot for account-level failures (email already registered, etc). */
export type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>> & {
  form?: string;
};
