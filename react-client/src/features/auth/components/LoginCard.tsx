import { Suspense } from "react";
import { ShieldCheckIcon } from "./icons";
import { LoginForm } from "./LoginForm";

export function LoginCard() {
  return (
    <div className="relative flex w-[600px] max-w-full flex-col gap-[18px] rounded-[22px] border border-bloom-border bg-bloom-card px-[44px] py-[32px] shadow-[0px_12px_32px_-4px_rgba(53,16,31,0.09)]">
      <div className="flex w-full flex-col gap-[7px]">
        <p className="text-[10px] font-extrabold uppercase text-bloom-pink">
          Welcome back
        </p>
        <h1 className="text-[32px] font-semibold text-bloom-ink">
          Log in to Market Bloom
        </h1>
        <p className="text-[13px] leading-[1.45] text-bloom-muted">
          Enter your email and password to access your Market Bloom account.
        </p>
      </div>

      <Suspense fallback={<div className="h-44 w-full animate-pulse rounded-[10px] bg-bloom-border/30" />}>
        <LoginForm />
      </Suspense>

      <div className="flex w-full items-center gap-2 rounded-[10px] bg-bloom-green-surface px-3 py-[10px]">
        <ShieldCheckIcon className="size-4 shrink-0 text-bloom-green" />
        <p className="text-[11px] leading-[1.35] text-bloom-green">
          Secure login with encrypted account protection.
        </p>
      </div>

      <p className="w-full text-center text-[13px] text-bloom-muted">
        New to the marketplace?{" "}
        <a href="#" className="font-extrabold text-bloom-pink">
          Create an account
        </a>
      </p>
    </div>
  );
}
