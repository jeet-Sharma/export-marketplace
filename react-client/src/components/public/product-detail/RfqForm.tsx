"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Panel from "@/components/ui/Panel";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export interface RfqFormProps {
  countries?: string[];
  productName: string;
}

// RFQ (Request for Quotation) form: buyer submits quantity, target price
// and delivery country. Client-only form state, no submit wiring yet since
// there is no backend endpoint for this page.
export default function RfqForm({ countries = [], productName }: RfqFormProps) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <Panel title="Request for Quotation" bodyClassName="p-4">
      {submitted ? (
        <p className="font-body text-teal text-[13px]">
          {"\u2713"} Your RFQ for {productName} has been submitted. The supplier will
          respond shortly.
        </p>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <Input id="rfq-quantity" label="Quantity" placeholder="e.g. 500 kg" required />
          <Input id="rfq-target-price" label="Target Price" placeholder="e.g. $7.00/kg" required />
          <label className="flex flex-col gap-1">
            <span className="font-body text-text-dim text-[12px]">Delivery Country</span>
            <select
              required
              defaultValue=""
              className="font-body bg-panel border border-line rounded px-[10px] py-[7px] text-text text-[13px] focus:outline-none focus:border-saffron"
            >
              <option value="" disabled>
                Select country
              </option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>
          <Button variant="accent" size="md" type="submit" className="w-full">
            Submit RFQ
          </Button>
        </form>
      )}
    </Panel>
  );
}
