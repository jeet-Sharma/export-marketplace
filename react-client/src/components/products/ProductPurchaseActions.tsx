import Link from "next/link";
import { routes } from "@/config/routes";

interface ProductPurchaseActionsProps {
  /** The product's real API slug — used to build the "Buy now" link to /checkout/[slug]. */
  slug: string;
}

/**
 * Purchase action row matching the Figma design: "Request a quote" (full
 * width primary), then "Add to cart" / "Buy now" side by side, plus the
 * "No payment required" / "Response typically within 24h" footer line.
 *
 * "Request a quote" and "Add to cart" stay disabled placeholders — there
 * is no RFQ or cart feature on the backend today (no `cart` or `quote`
 * module exists in nest-server/src/modules). Rendering them as
 * live-looking buttons that silently do nothing would mislead a buyer
 * into thinking a request was submitted. Same treatment as the disabled
 * "Message supplier" button on this page's supplier card.
 *
 * "Buy now" IS a real link to the UI-only checkout page
 * (/checkout/[slug], see CheckoutView's doc comment) — that page has no
 * backend to submit to either, but it's a real page a user can navigate
 * to and review, rather than a dead button.
 *
 * Rendered once from ProductDetailView, so it appears on every product's
 * detail page, not just a single product.
 */
export function ProductPurchaseActions({ slug }: ProductPurchaseActionsProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      <button
        type="button"
        disabled
        title="Requesting a quote isn't available yet"
        className="flex h-11 w-full items-center justify-center rounded-[10px] bg-pink/50 text-[14px] font-bold text-white disabled:cursor-not-allowed"
      >
        Request a quote
      </button>

      <div className="flex w-full gap-2">
        <button
          type="button"
          disabled
          title="Cart isn't available yet"
          className="flex h-11 flex-1 items-center justify-center rounded-[10px] border border-pink/40 bg-white text-[14px] font-bold text-pink/50 disabled:cursor-not-allowed"
        >
          Add to cart
        </button>
        <Link
          href={routes.checkout(slug)}
          className="flex h-11 flex-1 items-center justify-center rounded-[10px] bg-pink text-[14px] font-bold text-white transition-colors hover:bg-pink-hover"
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
