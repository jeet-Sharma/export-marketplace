"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import FieldError from "@/components/sellWithUs/FieldError";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { signupMeta } from "@/data/auth";
import { resolvePostSignupRoute } from "@/lib/auth";
import { signupSchema } from "@/lib/auth-schemas";
import { routes } from "@/config/routes";
import type { SignupFormValues } from "@/types/auth";

const INITIAL_VALUES: SignupFormValues = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

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
  const [formError, setFormError] = useState<string | undefined>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: INITIAL_VALUES,
    mode: "onSubmit",
  });

  async function onSubmit(values: SignupFormValues) {
    setFormError(undefined);

    try {
      await createAccount(values);
      router.push(resolvePostSignupRoute());
    } catch {
      setFormError(signupMeta.genericAuthError);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <h1 className="font-heading font-bold text-ink text-[24px] leading-[1.2]">
          {signupMeta.heading}
        </h1>
        <p className="font-body mt-1 text-text-dim text-[13px]">
          {signupMeta.subheading}
        </p>
      </div>

      <FieldError message={formError} />

      <div className="flex flex-col gap-1">
        <Input
          id="signup-full-name"
          label="Full name"
          placeholder="Jane Doe"
          autoComplete="name"
          {...register("fullName")}
        />
        <FieldError message={errors.fullName?.message} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="signup-email"
          label="Email"
          type="email"
          placeholder="jane@company.com"
          autoComplete="email"
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="signup-phone"
          label="Phone number"
          type="tel"
          placeholder="+91 98765 43210"
          autoComplete="tel"
          {...register("phone")}
        />
        <FieldError message={errors.phone?.message} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="signup-password"
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="signup-confirm-password"
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        <FieldError message={errors.confirmPassword?.message} />
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
