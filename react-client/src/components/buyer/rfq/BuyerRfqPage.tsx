 "use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/vendor/PageHeader";
import TableToolbar from "@/components/vendor/TableToolbar";
import StatRow from "@/components/vendor/dashboard/StatRow";
import BuyerRfqTable from "@/components/buyer/rfq/BuyerRfqTable";
import CompareQuotesPanel from "@/components/buyer/rfq/CompareQuotesPanel";
import { buyerRfqRequests, buyerRfqStats, buyerRfqMeta, supplierQuotes } from "@/data/buyerRfq";
import { buyerProfileSummary } from "@/data/buyerSeedData";
import type { BuyerRfqRequest } from "@/types/rfq";

// Buyer's sent RFQs + compare-quotes view — mirrors
// vendor/rfq/RfqPage.tsx's two-column layout (table + side panel), but the
// side panel compares received supplier quotes instead of composing one.
export default function BuyerRfqPage() {
  const [query, setQuery] = useState("");
  const [selectedRfq, setSelectedRfq] = useState<BuyerRfqRequest | null>(null);

  const visibleRequests = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return buyerRfqRequests;
    return buyerRfqRequests.filter((rfq) =>
      [rfq.id, rfq.product, rfq.country].some((field) => field.toLowerCase().includes(term)),
    );
  }, [query]);

  const quotesForSelectedRfq = useMemo(() => {
    if (!selectedRfq) return [];
    return supplierQuotes.filter((quote) => quote.rfqId === selectedRfq.id);
  }, [selectedRfq]);

  return (
    <>
      <PageHeader
        title="RFQ"
        breadcrumb="Buyer Panel / Requests for Quotation"
        actionLabel="+ New RFQ"
        verified={buyerProfileSummary.verified}
        verifiedLabel="Verified Buyer"
      />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          <StatRow stats={buyerRfqStats} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <TableToolbar
                inputId="buyer-rfq-search"
                label="Search RFQs"
                query={query}
                onQueryChange={setQuery}
                placeholder={buyerRfqMeta.searchPlaceholder}
              />
              <BuyerRfqTable requests={visibleRequests} onCompare={setSelectedRfq} />
            </div>
            <div className="lg:col-span-1">
              <CompareQuotesPanel rfq={selectedRfq} quotes={quotesForSelectedRfq} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
