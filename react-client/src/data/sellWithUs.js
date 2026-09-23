// Config + copy for the public "Sell With Us" vendor signup wizard.
// This is intentionally separate from /data/seedData.js (vendor dashboard
// seed data) and /config/navigation.ts (sidebar nav) — this is onboarding
// flow config for a route outside the vendor shell.

// Step definitions for the progress tracker, in order.
export const wizardSteps = [
  { id: "account", label: "Account" },
  { id: "company", label: "Company" },
  { id: "source", label: "Source" },
  { id: "destinations", label: "Destinations" },
  { id: "documents", label: "Documents" },
  { id: "review", label: "Review" },
];

// Countries the vendor can ship from (Step 3).
export const sourceCountries = [
  { id: "in", label: "India" },
  { id: "cn", label: "China" },
  { id: "vn", label: "Vietnam" },
  { id: "bd", label: "Bangladesh" },
  { id: "id", label: "Indonesia" },
];

// Destination checklist (Step 4). Real requirement: at least one required.
export const destinationCountries = [
  { id: "us", label: "United States" },
  { id: "uae", label: "UAE" },
  { id: "uk", label: "United Kingdom" },
];

// Required document uploads (Step 5).
export const requiredDocuments = [
  {
    id: "gst-certificate",
    label: "GST Certificate",
    helpText: "Upload your GST registration certificate (PDF, JPG or PNG).",
  },
  {
    id: "iec-certificate",
    label: "IEC Certificate",
    helpText: "Upload your Import Export Code certificate (PDF, JPG or PNG).",
  },
];

export const sellWithUsMeta = {
  heading: "Sell With Us",
  subheading: "Join ExportHub as a verified vendor in a few steps.",
  destinationsError: "Pick at least one destination country to continue",
  thankYouTitle: "Thank you! Your application is under review",
  thankYouBody:
    "Our team is verifying your documents and company details. You'll get an email once your vendor account is approved — usually within 2-3 business days.",
};
