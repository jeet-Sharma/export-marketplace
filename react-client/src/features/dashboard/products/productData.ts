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

export const PRODUCT_ROWS: ProductRow[] = [
  {
    id: "p1",
    name: "Organic Turmeric Fingers · Export Grade",
    image: "/products/turmeric-fingers.jpeg",
    category: "Food & beverage · Spices",
    origin: "Erode, India",
    tradeSetup: ["Tiers 100–500 kg · 500 kg+", "MOQ 100 kg · HS 091030", "Expiry 24 months"],
    price: "$1,250",
    supplier: "Malar Harvest Exports",
    verification: "verified",
    publication: "published",
    exportEligibility: "Export eligibility: Allowed",
    note: "Visible to buyers",
  },
  {
    id: "p2",
    name: "Ground Turmeric Powder · Bulk",
    image: "/products/turmeric-powder.jpeg",
    category: "Food & beverage · Spices",
    origin: "Tamil Nadu, India",
    tradeSetup: ["Quantity tiers unavailable", "MOQ pending · HS code —"],
    price: "Price pending",
    supplier: "Supplier submitted",
    verification: "pending",
    publication: "draft",
    exportEligibility: "Export eligibility: Pending",
  },
  {
    id: "p3",
    name: "Whole Dried Ginger",
    image: "/products/dried-ginger.png",
    category: "Food & beverage · Spices",
    origin: "Kochi, India",
    tradeSetup: ["Quantity tiers unavailable", "MOQ pending · HS code —"],
    price: "Price pending",
    supplier: "Supplier submitted",
    verification: "pending",
    publication: "draft",
    exportEligibility: "Export eligibility: Pending",
  },
  {
    id: "p4",
    name: "Cumin Seeds · Whole",
    image: "/products/cumin-seeds.jpeg",
    category: "Food & beverage · Spices",
    origin: "Gujarat, India",
    tradeSetup: ["Quantity tiers unavailable", "MOQ pending · HS code —"],
    price: "Price pending",
    supplier: "Supplier unavailable",
    verification: "unverified",
    publication: "draft",
    exportEligibility: "Export eligibility: Pending",
  },
  {
    id: "p5",
    name: "Black Peppercorns · Whole",
    image: "/products/black-peppercorns.jpeg",
    category: "Food & beverage · Spices",
    origin: "Kerala, India",
    tradeSetup: ["Quantity tiers unavailable", "MOQ pending · HS code —"],
    price: "Price pending",
    supplier: "Supplier unavailable",
    verification: "unverified",
    publication: "needs-review",
    exportEligibility: "Export eligibility: Pending",
  },
];
