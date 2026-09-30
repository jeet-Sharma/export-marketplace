"use client";

import { useState } from "react";
import type * as React from "react";
import Panel from "@/components/ui/Panel";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { formatStatValue } from "@/lib/formatters";
import type { CartTotals } from "@/types/cart";

export interface CheckoutSummaryProps {
  totals: CartTotals;
  itemCount: number;
  onPlaceOrder?: (address: string) => void;
}

/**
 * Order totals + shipping address + "Place Order". There is no payment
 * gateway or shipping-rates API wired up yet (see lib/cart.ts for the
 * flat-rate placeholder this reads from) — submitting only calls
 * onPlaceOrder with the entered address, the same "real submit path,
 * stubbed backend" pattern used by LoginForm/SignupForm's authenticate()/
 * createAccount() and RfqForm's client-only submitted state.
 */
export default function CheckoutSummary({
  totals,
  itemCount,
  onPlaceOrder,
}: CheckoutSummaryProps) {
  const [address, setAddress] = useState("");
  const [placed, setPlaced] = useState(false);

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedAddress = address.trim();
    if (!trimmedAddress) return;

    onPlaceOrder?.(trimmedAddress);
    setPlaced(true);
  }

  if (placed) {
    return (
      <Panel title="Order Summary" bodyClassName="p-4">
        <p className="font-body text-teal text-[13px]">
          {"\u2713"} Your order has been placed. A confirmation will be sent to
          your account once payment is verified.
        </p>
      </Panel>
    );
  }

  return (
    <Panel title="Order Summary" bodyClassName="p-4">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <dl className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <dt className="font-body text-text-dim text-[13px]">
              Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
            </dt>
            <dd className="font-heading font-medium text-text text-[13px]">
              {formatStatValue(totals.subtotal, "currency")}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="font-body text-text-dim text-[13px]">Shipping (est.)</dt>
            <dd className="font-heading font-medium text-text text-[13px]">
              {formatStatValue(totals.shippingEstimate, "currency")}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="font-body text-text-dim text-[13px]">Duties &amp; taxes (est.)</dt>
            <dd className="font-heading font-medium text-text text-[13px]">
              {formatStatValue(totals.taxEstimate, "currency")}
            </dd>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-line">
            <dt className="font-heading font-semibold text-ink text-[14px]">Total</dt>
            <dd className="font-heading font-bold text-ink text-[16px]">
              {formatStatValue(totals.grandTotal, "currency")}
            </dd>
          </div>
        </dl>

        <Input
          id="checkout-address"
          label="Shipping address"
          placeholder="Street, city, state, ZIP, country"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          required
        />

        <p className="font-body text-text-dim text-[12px]">
          Payment gateway integration is not connected yet — placing an
          order here does not charge a real payment method.
        </p>

        <Button
          variant="accent"
          size="md"
          type="submit"
          className="w-full"
          disabled={itemCount === 0}
        >
          Place Order
        </Button>
      </form>
    </Panel>
  );
}
