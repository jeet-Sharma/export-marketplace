import Image from "next/image";
import Link from "next/link";
import { routes } from "@/config/routes";
import type { ApiProductDetail } from "@/features/products/types/product-api.types";

const PLACEHOLDER_IMAGE = "/marketplace/product-1.png";

/** A single "Order fact" cell (label + bold value), matching the Figma "Order fact" spec. */
function Fact({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "positive" }) {
  return (
    <div className="flex flex-1 flex-col gap-0.5">
      <p className="text-[11px] text-ink/50">{label}</p>
      <p className={`text-[13px] font-bold ${tone === "positive" ? "text-delivery" : "text-ink"}`}>{value}</p>
    </div>
  );
}

/** A single price-breakdown row, matching the Figma "Price row" spec. Every amount reads "Pending confirmed price" since there's no live pricing/checkout backend yet — this isn't a placeholder bug, it's what the design itself calls for pre-confirmation. */
function PriceRow({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex w-full items-center gap-3">
      <p className={`flex-1 text-[13px] ${emphasis ? "font-extrabold text-ink" : "text-ink/50"}`}>{label}</p>
      <p
        className={`shrink-0 text-[13px] ${
          emphasis ? "font-extrabold text-pink" : value.includes("Pending") ? "font-bold text-pink" : "font-bold text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

interface CheckoutOrderSummaryProps {
  product: ApiProductDetail;
}

/**
 * Order summary sidebar, matching Figma node 1:3354. The product block
 * (image, origin, name) and the quantity/MOQ/delivery facts use the real
 * product from GET /products/:slug. Pricing rows read "Pending confirmed
 * price" per the design — there is no checkout/pricing backend yet, so
 * this isn't a stand-in for a real total, it matches the actual Figma
 * copy for a not-yet-priced B2B order. "Verified Looma supplier" is
 * static Figma copy, not a real verification feature (same caveat as
 * ProductSupplierCard elsewhere on the site — Vendor has no verification
 * concept on the backend).
 */
export function CheckoutOrderSummary({ product }: CheckoutOrderSummaryProps) {
  const image = product.images[0]?.url ?? PLACEHOLDER_IMAGE;
  const origin = product.sourceCountry?.name ?? "—";
  const moqText = product.moq ? `${product.moq} ${product.unit ?? ""}`.trim() : "—";
  const deliveryText = product.estimatedDeliveryText ?? "—";

  return (
    <aside className="flex w-full flex-col gap-4 rounded-[16px] border border-border bg-white p-[22px] shadow-[0px_5px_18px_-2px_rgba(17,24,39,0.09)] lg:w-[396px]">
      <div className="flex w-full items-center justify-between">
        <h2 className="text-[18px] text-ink">Order summary</h2>
        <Link href={routes.product(product.slug)} className="text-[12px] font-bold text-pink hover:underline">
          Edit order
        </Link>
      </div>

      <div className="flex w-full gap-3">
        <div className="relative size-[94px] shrink-0 overflow-hidden rounded-[10px]">
          <Image src={image} alt={product.name} fill className="object-cover" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <p className="text-[11px] font-extrabold uppercase text-pink">{origin}</p>
          <p className="text-[14px] leading-[1.35] text-ink">{product.name}</p>
          <div className="flex items-center gap-1.5">
            <svg aria-hidden viewBox="0 0 24 24" className="size-[14px] text-delivery" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <p className="text-[11px] font-bold text-delivery">Verified Looma supplier</p>
          </div>
        </div>
      </div>

      <hr className="w-full border-border" />

      <div className="flex w-full flex-col gap-3">
        <div className="flex w-full gap-3">
          <Fact label="Quantity" value={moqText} />
          <Fact label="Quantity tier" value={product.priceTiers[0] ? `${product.priceTiers[0].minQuantity}+` : "—"} />
        </div>
        <div className="flex w-full gap-3">
          <Fact label="Minimum order" value={product.moq ? `${moqText} MOQ` : "—"} />
          <Fact label="Estimated delivery" value={deliveryText} tone="positive" />
        </div>
      </div>

      <div className="flex w-full items-center gap-2 rounded-[10px] bg-cream p-3">
        <svg aria-hidden viewBox="0 0 24 24" className="size-[17px] shrink-0 text-ink/50" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] text-ink/50">Shipping to</p>
          <p className="text-[13px] font-bold text-ink">
            {product.targetCountries[0]?.name ?? "—"}
          </p>
        </div>
      </div>

      <hr className="w-full border-border" />

      <div className="flex w-full flex-col gap-3">
        <PriceRow label="Product price" value="Pending confirmed price" />
        <PriceRow label="Delivery" value="Pending confirmed price" />
        <PriceRow label="Approx. duties" value="$50 approx" />
        <hr className="w-full border-border" />
        <PriceRow label="Order total" value="Pending confirmed price" emphasis />
        <p className="text-[11px] leading-[1.45] text-ink/50">
          The supplier confirms product and delivery pricing before any payment is requested.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 rounded-[10px] bg-[#e8f5ef] p-3">
        <div className="flex items-center gap-2">
          <svg aria-hidden viewBox="0 0 24 24" className="size-5 text-delivery" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <p className="text-[13px] font-extrabold text-delivery">Trade with confidence</p>
        </div>
        <p className="text-[12px] text-ink">✓ Supplier identity verified</p>
        <p className="text-[12px] text-ink">✓ Secure order and message history</p>
        <p className="text-[12px] text-ink">✓ Human support for cross-border trade</p>
      </div>

      <div className="flex w-full items-center gap-2">
        <svg aria-hidden viewBox="0 0 24 24" className="size-[18px] text-ink/50" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
        <p className="flex-1 text-[12px] text-ink/50">
          Questions about this order? <span className="font-bold text-pink">Contact buyer support</span>
        </p>
      </div>

      <hr className="w-full border-border" />

      <div className="flex w-full flex-col gap-3">
        <p className="text-[13px] font-extrabold text-ink">What happens next</p>
        {[
          "The supplier reviews availability, product price, and delivery.",
          "You receive and review the confirmed order total.",
          "Pay securely, then track the delivery.",
        ].map((text, index) => (
          <div key={text} className="flex w-full items-start gap-2">
            <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-pink/10 text-[11px] font-extrabold text-pink">
              {index + 1}
            </span>
            <p className="flex-1 text-[12px] leading-[1.4] text-ink/50">{text}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}
