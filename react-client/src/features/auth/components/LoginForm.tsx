"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/store/hooks";
import { useLoginMutation } from "../authApi";
import { setCredentials } from "../authSlice";
import { loginSchema, type LoginFormValues } from "../loginSchema";
import {
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
} from "./icons";

/** Pull a user-safe message out of an RTK Query error without using `any`. */
function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "object" && data !== null && "message" in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string") {
        return message;
      }
    }
  }
  return "Something went wrong. Please try again.";
}

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      // .unwrap() throws on failure so we never treat a rejected request as
      // success (frontend-rules #18). Credentials go in the POST body — never
      // the URL — so the password can't leak into history/logs.
      const result = await login(values).unwrap();
      dispatch(
        setCredentials({ accessToken: result.accessToken, user: result.user }),
      );
      router.push("/dashboard");
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full flex-col gap-[18px]">
      <div className="flex w-full flex-col gap-[13px]">
        <div className="flex w-full flex-col gap-[7px]">
          <label
            htmlFor="email"
            className="text-[13px] font-bold text-bloom-ink"
          >
            Email address
          </label>
          <div className="flex h-12 w-full items-center gap-[10px] rounded-[10px] border border-bloom-border bg-white px-[14px] focus-within:border-bloom-pink focus-within:ring-2 focus-within:ring-bloom-pink/30">
            <MailIcon className="size-[18px] shrink-0 text-bloom-muted" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="w-full bg-transparent text-[14px] text-bloom-ink outline-none placeholder:text-bloom-muted"
              {...register("email")}
            />
          </div>
          {errors.email ? (
            <p className="text-[12px] font-medium text-bloom-pink">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-[7px]">
          <label
            htmlFor="password"
            className="text-[13px] font-bold text-bloom-ink"
          >
            Password
          </label>
          <div className="flex h-12 w-full items-center gap-[10px] rounded-[10px] border border-bloom-border bg-white px-[14px] focus-within:border-bloom-pink focus-within:ring-2 focus-within:ring-bloom-pink/30">
            <LockIcon className="size-[18px] shrink-0 text-bloom-muted" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full bg-transparent text-[14px] text-bloom-ink outline-none placeholder:text-bloom-muted"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="shrink-0 text-bloom-muted"
            >
              {showPassword ? (
                <EyeOffIcon className="size-[18px]" />
              ) : (
                <EyeIcon className="size-[18px]" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p className="text-[12px] font-medium text-bloom-pink">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div className="flex w-full items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" defaultChecked className="peer sr-only" />
            <span className="flex size-[17px] items-center justify-center rounded-[4px] border border-bloom-border bg-white peer-checked:border-bloom-pink peer-checked:bg-bloom-pink">
              <CheckIcon className="size-[11px] text-white" />
            </span>
            <span className="text-[12px] text-bloom-ink">Remember me</span>
          </label>
          <button
            type="button"
            disabled
            title="Password recovery is coming soon"
            className="cursor-not-allowed text-[12px] font-bold text-bloom-muted"
          >
            Forgot password?
          </button>
        </div>
      </div>

      {formError ? (
        <p
          role="alert"
          className="rounded-[10px] bg-bloom-pink/10 px-3 py-2 text-[12px] font-semibold text-bloom-pink"
        >
          {formError}
        </p>
      ) : null}

      <div className="flex w-full flex-col gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex h-12 w-full items-center justify-center rounded-[10px] bg-bloom-pink text-[15px] font-extrabold text-white transition-colors hover:bg-[#c2365f] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Signing in…" : "Log in"}
        </button>
        <div className="flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-bloom-border" />
          <span className="text-[11px] text-bloom-muted">or</span>
          <div className="h-px flex-1 bg-bloom-border" />
        </div>
        <button
          type="button"
          disabled
          title="Google sign-in is coming soon"
          className="flex h-[46px] w-full cursor-not-allowed items-center justify-center gap-[10px] rounded-[10px] border border-bloom-border bg-white opacity-60"
        >
          <span className="text-[18px] font-extrabold text-[#4285f4]">G</span>
          <span className="text-[14px] font-bold text-bloom-ink">
            Continue with Google
          </span>
        </button>
      </div>
    </form>
  );
}
