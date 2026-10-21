export type PublicationStatus = "published" | "draft" | "needs-review";
export type VerificationStatus = "verified" | "pending" | "unverified";

export type ProductRow = {
  id: string;
  name: string;
  /** Thumbnail photo in /public/products — real product imagery from the design */
  image: string;
  category: string;
  origin: string;
  tradeSetup: string[];
  price: string;
  supplier: string;
  verification: VerificationStatus;
  publication: PublicationStatus;
  exportEligibility: string;
  note?: string;
  rawStatus?: "DRAFT" | "PUBLISHED";
};

export type ProductSummary = {
  key: string;
  label: string;
  value: string;
  note: string;
  noteTone: "pink" | "green" | "muted";
  icon: "package" | "badge-check" | "file-pen-line";
  iconSurface: string;
};

export const PRODUCT_SUMMARIES: ProductSummary[] = [
  {
    key: "all",
    label: "All products",
    value: "186",
    note: "100% catalog",
    noteTone: "pink",
    icon: "package",
    iconSurface: "bg-[#fbeaf0]",
  },
  {
    key: "published",
    label: "Published",
    value: "142",
    note: "76% live",
    noteTone: "green",
    icon: "badge-check",
    iconSurface: "bg-bloom-green-surface",
  },
  {
    key: "drafts",
    label: "Drafts",
    value: "16",
    note: "4 incomplete",
    noteTone: "muted",
    icon: "file-pen-line",
    iconSurface: "bg-[#f4f1ee]",
  },
];
