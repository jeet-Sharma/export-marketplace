import Link from "next/link";
import { routes } from "@/config/routes";

interface ProductPurchaseActionsProps {
  /** The product's real API slug — used to build the "Buy now" link to /checkout/[slug]. */
  slug: string;
}

/**
 * Purchase action row matching the Figma design: all three actions
 * ("Request a quote", "Add to cart", "Buy now") on a single row so the
 * panel stays compact.
 *
 * "Request a quote" and "Add to cart" stay disabled placeholders — there
 * is no RFQ or cart feature on the backend today. Rendering them as
 * live-looking buttons that silently do nothing would mislead a buyer
 * into thinking a request was submitted.
 *
 * "Buy now" IS a real link to the UI-only checkout page (/checkout/[slug]).
 */
export function ProductPurchaseActions({ slug }: ProductPurchaseActionsProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      {/* All three actions in one row */}
      <div className="flex w-full gap-2">
        <button
          type="button"
          disabled
          title="Requesting a quote isn't available yet"
          className="flex h-11 flex-1 items-center justify-center rounded-[10px] bg-pink/50 text-[13px] font-bold text-white disabled:cursor-not-allowed"
        >
          Request a quote
        </button>
        <button
          type="button"
          disabled
          title="Cart isn't available yet"
          className="flex h-11 flex-1 items-center justify-center rounded-[10px] border border-pink/40 bg-white text-[13px] font-bold text-pink/50 disabled:cursor-not-allowed"
        >
          Add to cart
        </button>
        <Link
          href={routes.checkout(slug)}
          className="flex h-11 flex-1 items-center justify-center rounded-[10px] bg-pink text-[13px] font-bold text-white transition-colors hover:bg-pink-hover active:bg-pink-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2"
        >
          Buy now
        </Link>
      </div>

      <div className="flex w-full items-center justify-between pt-1 text-[11px] text-ink/40">
        <span>Coming soon · no payment required yet</span>
        <span>Response typically within 24h</span>
      </div>
    </div>
  );
}
