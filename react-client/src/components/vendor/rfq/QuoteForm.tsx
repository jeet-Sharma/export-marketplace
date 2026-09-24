"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Panel from "@/components/ui/Panel";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { RfqRequest } from "@/types/rfq";

/** The draft values captured on the quote composer, handed to onSubmit. */
export interface QuoteDraft {
  rfq: RfqRequest;
  unitPrice: string;
  leadTimeDays: string;
  notes: string;
}

export interface QuoteFormProps {
  rfq: RfqRequest | null;
  onClear: () => void;
  /**
   * Called with the draft when "Send Quote" is submitted. There is no
   * quotations API yet, so callers may omit this — the form still clears
   * itself via onClear either way, matching today's "presentational only"
   * behavior without leaving the button dead.
   */
  onSubmit?: (draft: QuoteDraft) => void;
}

// Quote composer for the selected RFQ. There is no quotations API yet, so
// onSubmit is optional — but the form is a real <form> now, so pressing
// Enter or clicking "Send Quote" always runs validation-free submit logic
// (notify the caller if provided, then clear the draft) instead of doing
// nothing.
export default function QuoteForm({ rfq, onClear, onSubmit }: QuoteFormProps) {
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

  const selectedRfq = rfq;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit?.({ rfq: selectedRfq, unitPrice, leadTimeDays: leadTime, notes });
    onClear();
  }

  return (
    <Panel title="Send a Quote" bodyClassName="p-4">
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
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
          <Button variant="accent" size="md" type="submit">
            Send Quote
          </Button>
          <Button variant="ghost" size="md" type="button" onClick={onClear}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}
