// Central `users.user_type` constants (Data_Modeling_2.md 2.5), mirroring
// the pattern in config/routes.ts — one source of truth for the literal
// values instead of "PLATFORM/VENDOR/BUYER" strings repeated across
// lib/auth.ts, types/auth.ts, and anywhere else that branches on user type.
export const USER_TYPE = {
  platform: "PLATFORM",
  vendor: "VENDOR",
  buyer: "BUYER",
} as const;

/** Any value of USER_TYPE, e.g. "PLATFORM" | "VENDOR" | "BUYER". */
export type UserTypeValue = (typeof USER_TYPE)[keyof typeof USER_TYPE];
