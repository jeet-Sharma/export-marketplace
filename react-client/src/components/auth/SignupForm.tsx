"use client";

import { useState } from "react";
import type * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FieldError from "@/components/sellWithUs/FieldError";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { signupMeta } from "@/data/auth";
import { resolvePostSignupRoute } from "@/lib/auth";
import { routes } from "@/config/routes";
import type { SignupFormErrors, SignupFormValues } from "@/types/auth";

const INITIAL_VALUES: SignupFormValues = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

/**
 * Client-side field validation. Rules mirror Step1Account.tsx's account
 * step (same name/email/phone/password/confirm-password checks) since
 * this form collects the same identity fields — kept as its own function
 * rather than importing that step's validator because that one is typed
 * against SellWithUsFormValues, not SignupFormValues, and pulling in the
 * whole wizard just for four shared rules would be a bigger coupling than
 * duplicating four `if` checks.
 */
function validate(values: SignupFormValues): SignupFormErrors {
  const errors: SignupFormErrors = {};

  if (!values.fullName.trim()) {
    errors.fullName = "Enter your full name";
  }

  if (!values.email.trim()) {
    errors.email = "Enter your email address";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!values.phone.trim()) {
    errors.phone = "Enter your phone number";
  } else if (!/^[0-9+\-\s()]{7,15}$/.test(values.phone.trim())) {
    errors.phone = "Enter a valid phone number";
  }

  if (!values.password) {
    errors.password = "Enter a password";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your password";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}

/**
 * Stand-in for a real account-creation call. There is no auth API in this
 * project yet (see lib/auth.ts) — this only exists so the form has a real
 * submit path to exercise (loading state, error state, redirect) instead
 * of a dead button. A real implementation creates a `users` row with
 * auth_provider = 'LOCAL', status = 'PENDING', email_verified = false
 * (Data_Modeling_2.md 2.5) and sends an EMAIL_VERIFY user_token (2.7).
 */
async function createAccount(values: SignupFormValues): Promise<void> {
  throw new Error(
    `No signup backend is configured yet. Submitted for ${values.email}.`,
  );
}

export default function SignupForm() {
  const router = useRouter();
  const [values, setValues] = useState<SignupFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange<K extends keyof SignupFormValues>(field: K, value: SignupFormValues[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
  }

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const fieldErrors = validate(values);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await createAccount(values);
      router.push(resolvePostSignupRoute());
    } catch {
      setErrors({ form: signupMeta.genericAuthError });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <div>
        <h1 className="font-heading font-bold text-ink text-[24px] leading-[1.2]">
          {signupMeta.heading}
        </h1>
        <p className="font-body mt-1 text-text-dim text-[13px]">
          {signupMeta.subheading}
        </p>
      </div>

      <FieldError message={errors.form} />

      <div className="flex flex-col gap-1">
        <Input
          id="signup-full-name"
          label="Full name"
          value={values.fullName}
          onChange={(event) => handleChange("fullName", event.target.value)}
          placeholder="Jane Doe"
          autoComplete="name"
        />
        <FieldError message={errors.fullName} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="signup-email"
          label="Email"
          type="email"
          value={values.email}
          onChange={(event) => handleChange("email", event.target.value)}
          placeholder="jane@company.com"
          autoComplete="email"
        />
        <FieldError message={errors.email} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="signup-phone"
          label="Phone number"
          type="tel"
          value={values.phone}
          onChange={(event) => handleChange("phone", event.target.value)}
          placeholder="+91 98765 43210"
          autoComplete="tel"
        />
        <FieldError message={errors.phone} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="signup-password"
          label="Password"
          type="password"
          value={values.password}
          onChange={(event) => handleChange("password", event.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        <FieldError message={errors.password} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="signup-confirm-password"
          label="Confirm password"
          type="password"
          value={values.confirmPassword}
          onChange={(event) => handleChange("confirmPassword", event.target.value)}
          placeholder="Re-enter your password"
          autoComplete="new-password"
        />
        <FieldError message={errors.confirmPassword} />
      </div>

      <Button variant="accent" size="md" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account\u2026" : "Sign up"}
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="font-body text-text-dim text-[12px]">
          {signupMeta.googleDividerLabel}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <GoogleAuthButton />

      <p className="font-body text-text-dim text-[13px] text-center">
        Already have an account?{" "}
        <Link href={routes.login} className="text-saffron hover:opacity-90">
          Log in
        </Link>
      </p>
    </form>
  );
}
