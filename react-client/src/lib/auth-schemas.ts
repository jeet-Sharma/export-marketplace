import { z } from "zod";

// Zod schemas mirroring the validation rules that used to live inline in
// LoginForm.tsx / SignupForm.tsx as react-hook-form `register()` options.
// Centralizing them here means the rules are declared once, in one place,
// instead of scattered across each field's register() call.

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address")
  .email("Enter a valid email address");

const phone = z
  .string()
  .trim()
  .min(1, "Enter your phone number")
  .regex(/^[0-9+\-\s()]{7,15}$/, "Enter a valid phone number");

/** Matches types/auth.ts LoginFormValues. */
export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
  rememberMe: z.boolean(),
});

export type LoginSchema = z.infer<typeof loginSchema>;

/**
 * Matches types/auth.ts SignupFormValues. confirmPassword must equal
 * password — expressed with `.refine` (Zod's cross-field check) attached
 * to the confirmPassword path, so the error message renders under that
 * field, same as the old react-hook-form `validate` function did.
 */
export const signupSchema = z
  .object({
    fullName: z.string().trim().min(1, "Enter your full name"),
    email,
    phone,
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.confirmPassword === values.password, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupSchema = z.infer<typeof signupSchema>;
