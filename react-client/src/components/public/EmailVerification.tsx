import Link from "next/link";
import Button from "@/components/ui/Button";
import { routes } from "@/config/routes";

// Post-verification confirmation screen, shown after a user follows the
// email verification link. Renders inside the same centered card shell as
// LoginForm/SignupForm (see app/verify-email/page.tsx) — this component
// only owns the content, not the page background or card, so all three
// public auth screens share one visual pattern instead of each defining
// its own surface.
export default function EmailVerification() {
  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-teal">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="h-10 w-10 text-panel"
        >
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <div>
        <h1 className="font-heading font-bold text-ink text-[26px] leading-[1.2] sm:text-[28px]">
          Email Verification
        </h1>
        <p className="font-body mt-3 text-text-dim text-[14px] leading-relaxed">
          Your email was verified. You can continue using the application.
        </p>
      </div>

      <Link href={routes.login} className="w-full mt-2">
        <Button variant="accent" size="md" className="w-full py-3 text-[14px]">
          Login
        </Button>
      </Link>
    </div>
  );
}
