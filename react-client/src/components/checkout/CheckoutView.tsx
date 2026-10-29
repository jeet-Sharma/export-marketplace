import { CheckoutChoiceCard, CheckoutCheckedRow } from "./CheckoutChoiceCard";
import { CheckoutField, CheckoutSelectField } from "./CheckoutFormField";
import { CheckoutHeading } from "./CheckoutHeading";
import { CheckoutOrderSummary } from "./CheckoutOrderSummary";
import { CheckoutSection } from "./CheckoutSection";
import type { ApiProductDetail } from "@/features/products/types/product-api.types";

interface CheckoutViewProps {
  product: ApiProductDetail;
}

const TRUCK_ICON = (
  <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M15 18H9" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <circle cx="17" cy="18" r="2" />
    <circle cx="7" cy="18" r="2" />
  </svg>
);

const BUILDING_ICON = (
  <svg aria-hidden viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);

/**
 * "Complete your order" checkout page, matching Figma node 1:3165
 * end-to-end: buyer contact, business shipping address, delivery option,
 * payment method, order notes, terms + submit, and the order summary
 * sidebar.
 *
 * UI only — there is no `orders`/`checkout`/`payments` module on the
 * backend (confirmed against nest-server/src/modules), so:
 * - Every text input/select below is a plain uncontrolled field with a
 *   realistic placeholder value, matching the Figma mock's filled-in
 *   example data. Nothing is validated or submitted anywhere.
 * - Delivery and payment "choices" are rendered as the single
 *   already-selected option shown in Figma (no second option exists to
 *   switch to in this phase).
 * - "Place order request" is disabled — see its own comment below for
 *   why clicking it must not look like a real submission.
 */
export function CheckoutView({ product }: CheckoutViewProps) {
  return (
    <main className="flex w-full flex-col gap-[22px] px-7 pb-[48px] pt-[22px]">
      <CheckoutHeading />

      <div className="flex w-full flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <CheckoutSection
            title="1. Buyer contact"
            description="Order updates and the confirmed supplier price will be sent here."
          >
            <div className="flex w-full gap-3">
              <CheckoutField label="Full name" placeholder="e.g. Maya de Vries" />
              <CheckoutField label="Business email" placeholder="e.g. maya@yourcompany.com" />
            </div>
            <div className="flex w-full gap-3">
              <CheckoutField label="Company" placeholder="e.g. Studio Noord B.V." />
              <CheckoutField label="Phone" placeholder="e.g. +31 10 204 7782" />
            </div>
            <CheckoutCheckedRow>
              Email me delivery and supplier updates for this order
            </CheckoutCheckedRow>
          </CheckoutSection>

          <CheckoutSection
            title="2. Business shipping address"
            description="Used to estimate export duties and arrange delivery."
          >
            <div className="flex w-full gap-3">
              <CheckoutSelectField
                label="Country / region"
                defaultValue={product.targetCountries[0]?.name ?? "Netherlands"}
                options={[product.targetCountries[0]?.name ?? "Netherlands", "Germany", "France", "United States"]}
              />
              <CheckoutSelectField
                label="Address type"
                defaultValue="Business"
                options={["Business", "Residential"]}
              />
            </div>
            <CheckoutField label="Street address" placeholder="e.g. Wijnhaven 107" />
            {/*
              * On small screens the three fields stack vertically to avoid
              * horizontal overflow. At sm+ the postal-code column snaps to its
              * fixed 180px width and the city/province fields share the rest.
              */}
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <div className="w-full sm:w-[180px] sm:shrink-0">
                <CheckoutField label="Postal code" placeholder="e.g. 3011 WN" />
              </div>
              <CheckoutField label="City" placeholder="e.g. Rotterdam" />
              <CheckoutField label="Province" placeholder="e.g. Zuid-Holland" />
            </div>
            <CheckoutField label="VAT / tax ID" placeholder="e.g. NL861234567B01" />
          </CheckoutSection>

          <CheckoutSection
            title="3. Delivery option"
            description="Final timing starts after supplier confirmation and payment."
          >
            <CheckoutChoiceCard
              icon={TRUCK_ICON}
              title="Standard international delivery"
              description={`Tracked business delivery · estimated ${product.estimatedDeliveryText ?? "timing TBD"}`}
              trailing="Pending confirmed price"
            />
            <div className="flex w-full gap-2 rounded-[10px] bg-[#e8f5ef] p-3">
              <svg aria-hidden viewBox="0 0 24 24" className="size-[17px] shrink-0 text-delivery" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              <p className="flex-1 text-[12px] leading-[1.45] text-delivery">
                Approximate import duties are $50. Final duties and logistics are confirmed before payment.
              </p>
            </div>
          </CheckoutSection>

          <CheckoutSection
            title="4. Payment method"
            description="You will not be charged until the supplier confirms the final product and delivery price."
          >
            <CheckoutChoiceCard
              icon={BUILDING_ICON}
              title="Business card"
              description="Visa, Mastercard or American Express · available after price confirmation"
            />
            <CheckoutCheckedRow>
              Billing address is the same as the business shipping address
            </CheckoutCheckedRow>
          </CheckoutSection>

          <CheckoutSection
            title="5. Order notes"
            description="Optional instructions for packaging, documents, or delivery."
          >
            <textarea
              rows={3}
              placeholder="e.g. Please include the commercial invoice, packing list, certificate of origin, and current organic certification with the shipment."
              className="w-full resize-none rounded-[6px] border border-border bg-white p-3 text-[13px] leading-[1.5] text-ink outline-none placeholder:text-ink/40 focus-visible:border-pink"
            />
            <p className="w-full text-right text-[11px] text-ink/50">0 / 500 characters</p>
          </CheckoutSection>

          <section className="flex w-full flex-col gap-4 rounded-[16px] border border-border bg-white p-[22px] shadow-[0px_5px_18px_-2px_rgba(17,24,39,0.09)]">
            <CheckoutCheckedRow>
              I agree to Export Marketplace&apos;s <span className="font-bold text-pink">Marketplace Terms</span> and
              acknowledge that the order is subject to supplier price confirmation before payment.
            </CheckoutCheckedRow>

            <button
              type="button"
              disabled
              title="Order submission isn't available yet — there's no checkout backend to send this to."
              className="flex h-[52px] w-full items-center justify-center rounded-[10px] bg-pink/50 text-[15px] font-extrabold text-white disabled:cursor-not-allowed"
            >
              Place order request
            </button>

            <div className="flex w-full items-center justify-center gap-1.5">
              <svg aria-hidden viewBox="0 0 24 24" className="size-[15px] text-ink/50" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <p className="text-[12px] text-ink/50">
                No charge today · You review the confirmed price before payment
              </p>
            </div>
          </section>
        </div>

        <CheckoutOrderSummary product={product} />
      </div>
    </main>
  );
}
