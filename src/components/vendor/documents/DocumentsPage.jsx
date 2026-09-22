"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/vendor/PageHeader";
import TableToolbar from "@/components/vendor/TableToolbar";
import StatRow from "@/components/vendor/dashboard/StatRow";
import DocumentTable from "@/components/vendor/documents/DocumentTable";
import UploadSlot from "@/components/vendor/documents/UploadSlot";
import { documents, documentStats, documentsMeta } from "@/data/documents";

export default function DocumentsPage() {
  const [query, setQuery] = useState("");

  const visibleDocuments = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter((doc) =>
      [doc.name, doc.category, doc.reference].some((field) =>
        field.toLowerCase().includes(term),
      ),
    );
  }, [query]);

  const missingCount = documents.filter((doc) => doc.status === "missing")
    .length;

  return (
    <>
      <PageHeader
        title="Documents"
        breadcrumb="Vendor Panel / Documents & Compliance"
        actionLabel="+ Upload"
      />

      <main className="w-full px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          <StatRow stats={documentStats} />
          <UploadSlot missingCount={missingCount} />
          <div className="flex flex-col gap-4">
            <TableToolbar
              inputId="document-search"
              label="Search documents"
              query={query}
              onQueryChange={setQuery}
              placeholder={documentsMeta.searchPlaceholder}
              actionLabel="Download All"
            />
            <DocumentTable documents={visibleDocuments} />
          </div>
        </div>
      </main>
    </>
  );
}
