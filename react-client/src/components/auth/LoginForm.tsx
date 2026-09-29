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
import { loginMeta } from "@/data/auth";
import { getLoginBlockReason, resolvePostLoginRoute } from "@/lib/auth";
import { loginSchema } from "@/lib/auth-schemas";
import { routes } from "@/config/routes";
import type { AuthenticatedUser, LoginFormValues } from "@/types/auth";

const INITIAL_VALUES: LoginFormValues = {
  email: "",
  password: "",
  rememberMe: false,
};

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
  const [formError, setFormError] = useState<string | undefined>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: INITIAL_VALUES,
    mode: "onSubmit",
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(undefined);

    try {
      const user = await authenticate(values);

      const blockReason = getLoginBlockReason(user.status);
      if (blockReason) {
        setFormError(blockReason);
        return;
      }

      router.push(resolvePostLoginRoute(user.userType));
    } catch {
      setFormError(loginMeta.genericAuthError);
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <h1 className="font-heading font-bold text-ink text-[24px] leading-[1.2]">
          {loginMeta.heading}
        </h1>
        <p className="font-body mt-1 text-text-dim text-[13px]">
          {loginMeta.subheading}
        </p>
      </div>

      <FieldError message={formError} />

      <div className="flex flex-col gap-1">
        <Input
          id="login-email"
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
          id="login-password"
          label="Password"
          type="password"
          placeholder="Your password"
          autoComplete="current-password"
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>

      <div className="flex items-center justify-between">
        <label htmlFor="login-remember-me" className="flex items-center gap-2 cursor-pointer">
          <input
            id="login-remember-me"
            type="checkbox"
            className="h-4 w-4 accent-saffron"
            {...register("rememberMe")}
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
