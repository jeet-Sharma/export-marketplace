import { z } from "zod";
import { requiredDocuments } from "@/data/sellWithUs";

// Zod schemas for the "Sell With Us" vendor onboarding wizard, one per
// step, mirroring the validation rules that used to live in each step's
// exported `validate...` function (Step1Account.tsx etc). Kept as
// separate schemas (rather than one big object schema) because the
// wizard validates one step at a time via react-hook-form's `trigger()`,
// scoped to that step's fields — see SellWithUsWizard.tsx.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,15}$/;
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const IEC_PATTERN = /^[A-Z0-9]{10}$/;

/**
 * Step 1: account credentials. Kept as a plain object schema (not wrapped
 * in `.refine` here) so it can be spread into `sellWithUsSchema` below —
 * the confirmPassword-matches-password check is applied separately, once,
 * on the composed schema instead.
 */
export const accountObjectSchema = z.object({
  name: z.string().trim().min(1, "Enter your full name"),
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address")
    .regex(EMAIL_PATTERN, "Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .min(1, "Enter your phone number")
    .regex(PHONE_PATTERN, "Enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm your password"),
});

/** Step 1 validator used by the wizard's per-step `trigger()` check. */
export const accountSchema = accountObjectSchema.refine(
  (values) => values.confirmPassword === values.password,
  { message: "Passwords do not match", path: ["confirmPassword"] },
);

/** Step 2: company legal identity. */
export const companySchema = z.object({
  legalName: z.string().trim().min(1, "Enter the company's legal name"),
  gstNumber: z
    .string()
    .trim()
    .min(1, "Enter the GST number")
    .transform((value) => value.toUpperCase())
    .refine((value) => GSTIN_PATTERN.test(value), "Enter a valid 15-character GSTIN"),
  iecNumber: z
    .string()
    .trim()
    .min(1, "Enter the IEC number")
    .transform((value) => value.toUpperCase())
    .refine((value) => IEC_PATTERN.test(value), "Enter a valid 10-character IEC number"),
  companyPhone: z
    .string()
    .trim()
    .min(1, "Enter a company phone number")
    .regex(PHONE_PATTERN, "Enter a valid phone number"),
  companyEmail: z
    .string()
    .trim()
    .min(1, "Enter a company email address")
    .regex(EMAIL_PATTERN, "Enter a valid email address"),
  address: z.string().trim().min(1, "Enter the registered address"),
});

/** Step 3: single-select source country. */
export const sourceSchema = z.object({
  sourceCountry: z.string().min(1, "Select your source country"),
});

/** Step 4: destination checklist — at least one is required. */
export const destinationsSchema = z.object({
  destinations: z.array(z.string()).min(1, "Pick at least one destination country to continue"),
});

/**
 * Step 5: required document uploads. `documents` is a record keyed by
 * RequiredDocument.id (e.g. "gst-certificate") — every id declared in
 * requiredDocuments must map to a File. Built from that data file instead
 * of hardcoding the two current document ids, so adding a new required
 * document there is picked up here automatically.
 */
export const documentsSchema = z.object({
  documents: z
    .record(z.instanceof(File).optional())
    .superRefine((documents, ctx) => {
      requiredDocuments.forEach((doc) => {
        if (!documents[doc.id]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Upload your ${doc.label.toLowerCase()}`,
            path: [doc.id],
          });
        }
      });
    }),
});

/** Step 6 (Review) has nothing to validate — it only displays prior steps. */
export const reviewSchema = z.object({});

/**
 * Full wizard schema, composed from every step's object shape and then
 * re-applying the cross-field password check. Used as the single source
 * of truth for react-hook-form's resolver — trigger() calls still scope
 * validation to one step's fields at a time, but this is what the form
 * is ultimately checked against on final submit.
 */
export const sellWithUsSchema = z
  .object({
    ...accountObjectSchema.shape,
    ...companySchema.shape,
    ...sourceSchema.shape,
    ...destinationsSchema.shape,
    ...documentsSchema.shape,
  })
  .refine((values) => values.confirmPassword === values.password, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SellWithUsSchema = z.infer<typeof sellWithUsSchema>;
