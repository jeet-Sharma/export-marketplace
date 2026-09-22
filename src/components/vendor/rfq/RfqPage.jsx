"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/vendor/PageHeader";
import TableToolbar from "@/components/vendor/TableToolbar";
import StatRow from "@/components/vendor/dashboard/StatRow";
import RfqTable from "@/components/vendor/rfq/RfqTable";
import QuoteForm from "@/components/vendor/rfq/QuoteForm";
import { rfqRequests, rfqStats, rfqMeta } from "@/data/rfq";

export default function RfqPage() {
  const [query, setQuery] = useState("");
  const [selectedRfq, setSelectedRfq] = useState(null);

  const visibleRequests = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rfqRequests;
    return rfqRequests.filter((rfq) =>
      [rfq.id, rfq.product, rfq.buyer, rfq.country].some((field) =>
        field.toLowerCase().includes(term),
      ),
    );
  }, [query]);

  return (
    <>
      <PageHeader
        title="RFQ"
        breadcrumb="Vendor Panel / Requests for Quotation"
        actionLabel="+ New Quote"
      />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          <StatRow stats={rfqStats} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 flex flex-col gap-4">
              <TableToolbar
                inputId="rfq-search"
                query={query}
                onQueryChange={setQuery}
                placeholder={rfqMeta.searchPlaceholder}
              />
              <RfqTable requests={visibleRequests} onQuote={setSelectedRfq} />
            </div>
            <div className="lg:col-span-1">
              <QuoteForm
                rfq={selectedRfq}
                onClear={() => setSelectedRfq(null)}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
