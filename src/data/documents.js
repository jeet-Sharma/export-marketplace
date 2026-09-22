// Export documentation and compliance records.

export const documentStats = [
  {
    id: "readiness",
    label: "Export Readiness",
    value: "75%",
    delta: "3 docs missing",
    trend: "down",
  },
  {
    id: "verified",
    label: "Verified",
    value: "6",
    delta: "+2",
    trend: "up",
  },
  {
    id: "pending",
    label: "Awaiting Review",
    value: "2",
    delta: "with checker",
    trend: "neutral",
  },
  {
    id: "expiring",
    label: "Expiring Soon",
    value: "1",
    delta: "within 30 days",
    trend: "down",
  },
];

export const documents = [
  {
    id: "doc-1",
    name: "Certificate of Origin",
    category: "Trade",
    reference: "COO-2026-114",
    updated: "2026-09-12",
    expires: "2027-09-12",
    status: "verified",
  },
  {
    id: "doc-2",
    name: "Commercial Invoice",
    category: "Commercial",
    reference: "INV-101",
    updated: "2026-09-14",
    expires: "\u2014",
    status: "verified",
  },
  {
    id: "doc-3",
    name: "Phytosanitary Certificate",
    category: "Compliance",
    reference: "PHY-2026-51",
    updated: "2026-09-09",
    expires: "2026-10-09",
    status: "uploaded",
  },
  {
    id: "doc-4",
    name: "Export Licence",
    category: "Compliance",
    reference: "\u2014",
    updated: "\u2014",
    expires: "\u2014",
    status: "missing",
  },
  {
    id: "doc-5",
    name: "Bill of Lading",
    category: "Logistics",
    reference: "\u2014",
    updated: "\u2014",
    expires: "\u2014",
    status: "missing",
  },
  {
    id: "doc-6",
    name: "Insurance Certificate",
    category: "Logistics",
    reference: "\u2014",
    updated: "\u2014",
    expires: "\u2014",
    status: "missing",
  },
];

export const documentsMeta = {
  panelTitle: "Document Vault",
  searchPlaceholder: "Search documents...",
  storageNote: "Files are stored in object storage; only metadata lives here.",
};
