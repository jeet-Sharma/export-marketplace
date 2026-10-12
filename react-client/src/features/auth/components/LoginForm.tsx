"use client";

import { useState } from "react";
import {
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
} from "./icons";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className="flex w-full flex-col gap-[18px]">
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
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="w-full bg-transparent text-[14px] text-bloom-ink outline-none placeholder:text-bloom-muted"
            />
          </div>
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
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full bg-transparent text-[14px] text-bloom-ink outline-none placeholder:text-bloom-muted"
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
        </div>

        <div className="flex w-full items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" defaultChecked className="peer sr-only" />
            <span className="flex size-[17px] items-center justify-center rounded-[4px] border border-bloom-border bg-white peer-checked:border-bloom-pink peer-checked:bg-bloom-pink">
              <CheckIcon className="size-[11px] text-white" />
            </span>
            <span className="text-[12px] text-bloom-ink">Remember me</span>
          </label>
          <a href="#" className="text-[12px] font-bold text-bloom-pink">
            Forgot password?
          </a>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center rounded-[10px] bg-bloom-pink text-[15px] font-extrabold text-white transition-colors hover:bg-[#c2365f]"
        >
          Log in
        </button>
        <div className="flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-bloom-border" />
          <span className="text-[11px] text-bloom-muted">or</span>
          <div className="h-px flex-1 bg-bloom-border" />
        </div>
        <button
          type="button"
          className="flex h-[46px] w-full items-center justify-center gap-[10px] rounded-[10px] border border-bloom-border bg-white transition-colors hover:bg-bloom-cream"
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
