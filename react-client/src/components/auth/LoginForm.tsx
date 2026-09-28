"use client";

import { useState } from "react";
import type * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FieldError from "@/components/sellWithUs/FieldError";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { loginMeta } from "@/data/auth";
import { getLoginBlockReason, resolvePostLoginRoute } from "@/lib/auth";
import { routes } from "@/config/routes";
import type { AuthenticatedUser, LoginFormErrors, LoginFormValues } from "@/types/auth";

const INITIAL_VALUES: LoginFormValues = {
  email: "",
  password: "",
  rememberMe: false,
};

/**
 * Client-side field validation, run before any auth call is attempted.
 * Rules mirror the account step of the Sell With Us wizard (email format,
 * password required) — there is no min-length check here because login
 * verifies an existing password, it doesn't set a new one.
 */
function validate(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Enter your email address";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!values.password) {
    errors.password = "Enter your password";
  }

  return errors;
}

/**
 * Stand-in for a real credential check. There is no auth API in this
 * project yet (see lib/auth.ts) — this only exists so the form has a real
 * submit path to exercise (loading state, error state, redirect) instead
 * of a dead button. Swap this for a real API call when one exists; every
 * caller below already treats it as async and handles the rejected case.
 */
async function authenticate(values: LoginFormValues): Promise<AuthenticatedUser> {
  throw new Error(
    `No authentication backend is configured yet. Submitted for ${values.email}.`,
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<LoginFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange<K extends keyof LoginFormValues>(field: K, value: LoginFormValues[K]) {
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
      const user = await authenticate(values);

      const blockReason = getLoginBlockReason(user.status);
      if (blockReason) {
        setErrors({ form: blockReason });
        return;
      }

      router.push(resolvePostLoginRoute(user.userType));
    } catch {
      setErrors({ form: loginMeta.genericAuthError });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <div>
        <h1 className="font-heading font-bold text-ink text-[24px] leading-[1.2]">
          {loginMeta.heading}
        </h1>
        <p className="font-body mt-1 text-text-dim text-[13px]">
          {loginMeta.subheading}
        </p>
      </div>

      <FieldError message={errors.form} />

      <div className="flex flex-col gap-1">
        <Input
          id="login-email"
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
          id="login-password"
          label="Password"
          type="password"
          value={values.password}
          onChange={(event) => handleChange("password", event.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
        />
        <FieldError message={errors.password} />
      </div>

      <div className="flex items-center justify-between">
        <label htmlFor="login-remember-me" className="flex items-center gap-2 cursor-pointer">
          <input
            id="login-remember-me"
            type="checkbox"
            checked={values.rememberMe}
            onChange={(event) => handleChange("rememberMe", event.target.checked)}
            className="h-4 w-4 accent-saffron"
          />
          <span className="font-body text-text text-[13px]">Remember me</span>
        </label>

        <Link href={routes.home} className="font-body text-saffron text-[13px] hover:opacity-90">
          Forgot password?
        </Link>
      </div>

      <Button variant="accent" size="md" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in\u2026" : "Log in"}
      </Button>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="font-body text-text-dim text-[12px]">
          {loginMeta.googleDividerLabel}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <GoogleAuthButton />

      <p className="font-body text-text-dim text-[13px] text-center">
        Don&apos;t have an account?{" "}
        <Link href={routes.signup} className="text-saffron hover:opacity-90">
          Sign up
        </Link>
      </p>
    </form>
  );
}
