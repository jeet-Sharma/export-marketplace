"use client";

import { useState } from "react";
import Panel from "@/components/ui/Panel";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

// Quote composer for the selected RFQ. Presentational only — there is no
// quotations API yet, so submitting just clears the draft.
export default function QuoteForm({ rfq, onClear }) {
  const [unitPrice, setUnitPrice] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [notes, setNotes] = useState("");

  if (!rfq) {
    return (
      <Panel title="Send a Quote" bodyClassName="p-4">
        <p className="font-body text-text-dim text-[13px]">
          Pick an open RFQ and choose Quote to draft a response.
        </p>
      </Panel>
    );
  }

  return (
    <Panel title="Send a Quote" bodyClassName="p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 p-3 bg-paper border border-line rounded">
          <span className="font-heading font-semibold text-ink text-[13px]">
            {rfq.id} {"\u00B7"} {rfq.product}
          </span>
          <span className="font-body text-text-dim text-[12px]">
            {rfq.buyer} ({rfq.country}) {"\u00B7"} {rfq.quantity} {"\u00B7"}{" "}
            target {rfq.target}
          </span>
        </div>

        <Input
          id="quote-unit-price"
          label="Your unit price"
          placeholder={rfq.target}
          value={unitPrice}
          onChange={(event) => setUnitPrice(event.target.value)}
        />
        <Input
          id="quote-lead-time"
          label="Lead time (days)"
          placeholder="e.g. 21"
          value={leadTime}
          onChange={(event) => setLeadTime(event.target.value)}
        />
        <Input
          id="quote-notes"
          label="Terms / notes"
          placeholder="Packaging, payment terms, validity"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />

        <div className="flex items-center gap-2">
          <Button variant="accent" size="md">
            Send Quote
          </Button>
          <Button variant="ghost" size="md" onClick={onClear}>
            Cancel
          </Button>
        </div>
      </div>
    </Panel>
  );
}
