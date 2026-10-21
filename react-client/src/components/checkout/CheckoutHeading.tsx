import Link from "next/link";
import { routes } from "@/config/routes";

/** A single step marker (checkmark/number circle + label), matching the Figma "Checkout step" spec. */
function Step({
  state,
  number,
  label,
}: {
  state: "done" | "active" | "upcoming";
  number: string;
  label: string;
}) {
  const circleClasses =
    state === "done"
      ? "border-delivery bg-delivery text-white"
      : state === "active"
        ? "border-pink bg-pink text-white"
        : "border-border bg-white text-ink/50";
  const labelClasses =
    state === "upcoming" ? "font-semibold text-ink/50" : "font-extrabold text-ink";

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex size-[26px] items-center justify-center rounded-full border text-[12px] font-extrabold ${circleClasses}`}
      >
        {number}
      </div>
      <p className={`text-[13px] ${labelClasses}`}>{label}</p>
    </div>
  );
}

/**
 * Checkout page heading: breadcrumb + "Secure B2B checkout" badge, title,
 * and the 3-step progress indicator (Cart → Details → Confirmation),
 * matching Figma node 1:3209. "Details" (this page) is always the active
 * step — there's no real cart or confirmation page behind steps 1/3 yet,
 * so the connector lines are static, not navigable.
 */
export function CheckoutHeading() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full items-center justify-between">
        <p className="text-[13px] text-ink/50">
          <Link href={routes.products} className="hover:text-ink">
            Cart
          </Link>
          {"  /  "}
          <span className="text-ink">Secure checkout</span>
        </p>
        <div className="flex items-center gap-1.5">
          <svg aria-hidden viewBox="0 0 24 24" className="size-[15px] text-delivery" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p className="text-[12px] font-bold text-delivery">Secure B2B checkout</p>
        </div>
      </div>

      <div className="flex w-full items-end justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[34px] text-ink">Complete your order</h1>
          <p className="text-[14px] text-ink/50">
            Confirm your business details and submit the order for supplier price confirmation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Step state="done" number="✓" label="Cart" />
          <span className="h-px w-[34px] bg-border" aria-hidden />
          <Step state="active" number="2" label="Details" />
          <span className="h-px w-[34px] bg-border" aria-hidden />
          <Step state="upcoming" number="3" label="Confirmation" />
        </div>
      </div>
    </div>
  );
}
