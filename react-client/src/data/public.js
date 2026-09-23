// Public homepage seed data: hero, categories, featured products/suppliers,
// how-it-works steps and testimonials. Kept separate from vendor seed data
// (data/products.js, data/profile.js) because that data models internal
// maker-checker workflow state, not public-facing catalog content.

export const heroContent = {
  eyebrow: "B2B Export Marketplace",
  headline: "Export Indian Products Worldwide",
  subheadline:
    "Connect with verified suppliers, compare quotes and ship globally with trade assurance on every order.",
  searchPlaceholder: "Search products, suppliers, HS code, country...",
  searchScopes: ["Products", "Suppliers", "HS Code", "Country"],
  trustBadges: [
    { id: "verified", label: "Verified Suppliers" },
    { id: "countries", label: "50+ Countries" },
    { id: "shipping", label: "Global Shipping" },
    { id: "support", label: "Export Support" },
  ],
};

export const categories = [
  { id: "spices", label: "Spices", emoji: "\u{1F336}", productCount: 240 },
  { id: "textiles", label: "Textiles", emoji: "\u{1F9F5}", productCount: 180 },
  { id: "handicrafts", label: "Handicrafts", emoji: "\u{1FAB5}", productCount: 95 },
  { id: "agriculture", label: "Agriculture", emoji: "\u{1F33E}", productCount: 130 },
];

export const featuredProducts = [
  {
    id: "fp-1",
    name: "Turmeric Powder",
    emoji: "\u{1F33F}",
    price: "From $8/kg",
    moq: "MOQ: 100 kg",
    supplierName: "ABC Exports",
    supplierVerified: true,
  },
  {
    id: "fp-2",
    name: "Cotton Bedsheet",
    emoji: "\u{1F6CF}",
    price: "From $8",
    moq: "MOQ: 50 units",
    supplierName: "XYZ Traders",
    supplierVerified: true,
  },
  {
    id: "fp-3",
    name: "Wooden Handicraft",
    emoji: "\u{1FAB5}",
    price: "From $1.5/pc",
    moq: "MOQ: 20 units",
    supplierName: "India Crafts",
    supplierVerified: true,
  },
  {
    id: "fp-4",
    name: "Red Chilli Powder",
    emoji: "\u{1F336}",
    price: "From $6.50/kg",
    moq: "MOQ: 200 kg",
    supplierName: "ABC Exports",
    supplierVerified: true,
  },
];

// Full product detail records, keyed by the same id used in
// featuredProducts. Powers the public product detail page
// (app/products/[productId]) reached via each card's "View" action.
export const productDetails = {
  "fp-1": {
    id: "fp-1",
    name: "Turmeric Powder",
    emoji: "\u{1F33F}",
    gallery: ["\u{1F33F}", "\u{1F3FA}", "\u{1F4E6}"],
    description:
      "Premium quality turmeric powder sourced from Erode, Tamil Nadu. Sun-dried and stone-ground to retain natural curcumin content. Suitable for food, cosmetic and pharmaceutical export.",
    priceTiers: [
      { range: "100\u2013500 kg", price: "$8.00/kg" },
      { range: "500+ kg", price: "$7.20/kg" },
    ],
    moq: "100 kg",
    hsCode: "091030",
    exportEligibility: "Allowed",
    countryRestriction: "None",
    expiry: "12 months from packaging",
    countryLogistics: {
      USA: { delivery: "7\u201310 days", duties: "$50 approx" },
      UAE: { delivery: "4\u20136 days", duties: "$20 approx" },
      UK: { delivery: "6\u20139 days", duties: "$35 approx" },
    },
    supplier: {
      name: "ABC Exports",
      initials: "AE",
      country: "India",
      verified: true,
      responseTime: "Usually responds within 4 hours",
    },
    shipping: {
      readyToShip: "3\u20135 business days",
      shippedFrom: "Chennai Port, India",
      incoterms: "FOB, CIF, EXW available",
    },
  },
  "fp-2": {
    id: "fp-2",
    name: "Cotton Bedsheet",
    emoji: "\u{1F6CF}",
    gallery: ["\u{1F6CF}", "\u{1F9F5}", "\u{1F4E6}"],
    description:
      "100% combed cotton bedsheets, 300 thread count, available in standard export sizes and custom prints. Pre-shrunk and colorfast dyed.",
    priceTiers: [
      { range: "50\u2013200 units", price: "$8.00/unit" },
      { range: "200+ units", price: "$6.80/unit" },
    ],
    moq: "50 units",
    hsCode: "630231",
    exportEligibility: "Allowed",
    countryRestriction: "None",
    expiry: "Not applicable",
    countryLogistics: {
      USA: { delivery: "10\u201314 days", duties: "$65 approx" },
      UAE: { delivery: "5\u20137 days", duties: "$25 approx" },
      UK: { delivery: "8\u201312 days", duties: "$45 approx" },
    },
    supplier: {
      name: "XYZ Traders",
      initials: "XT",
      country: "India",
      verified: true,
      responseTime: "Usually responds within 6 hours",
    },
    shipping: {
      readyToShip: "7\u201310 business days",
      shippedFrom: "Tuticorin Port, India",
      incoterms: "FOB, CIF available",
    },
  },
  "fp-3": {
    id: "fp-3",
    name: "Wooden Handicraft",
    emoji: "\u{1FAB5}",
    gallery: ["\u{1FAB5}", "\u{1F6CF}", "\u{1F4E6}"],
    description:
      "Hand-carved wooden decor pieces made by artisan clusters in Saharanpur. Finished with food-safe lacquer, available unfinished on request.",
    priceTiers: [
      { range: "20\u201399 units", price: "$1.50/pc" },
      { range: "100+ units", price: "$1.10/pc" },
    ],
    moq: "20 units",
    hsCode: "442190",
    exportEligibility: "Allowed",
    countryRestriction: "Requires phytosanitary certificate for EU",
    expiry: "Not applicable",
    countryLogistics: {
      USA: { delivery: "9\u201312 days", duties: "$30 approx" },
      UAE: { delivery: "5\u20137 days", duties: "$15 approx" },
      UK: { delivery: "7\u201311 days", duties: "$28 approx" },
    },
    supplier: {
      name: "India Crafts",
      initials: "IC",
      country: "India",
      verified: true,
      responseTime: "Usually responds within 12 hours",
    },
    shipping: {
      readyToShip: "10\u201314 business days",
      shippedFrom: "Mundra Port, India",
      incoterms: "FOB, EXW available",
    },
  },
  "fp-4": {
    id: "fp-4",
    name: "Red Chilli Powder",
    emoji: "\u{1F336}",
    gallery: ["\u{1F336}", "\u{1F3FA}", "\u{1F4E6}"],
    description:
      "Sun-dried red chilli powder, medium-hot, ground from Guntur chillies. Free from artificial colors, lab tested for pesticide residue.",
    priceTiers: [
      { range: "200\u2013999 kg", price: "$6.50/kg" },
      { range: "1000+ kg", price: "$5.90/kg" },
    ],
    moq: "200 kg",
    hsCode: "090430",
    exportEligibility: "Allowed",
    countryRestriction: "FDA registration required for USA",
    expiry: "9 months from packaging",
    countryLogistics: {
      USA: { delivery: "8\u201311 days", duties: "$55 approx" },
      UAE: { delivery: "4\u20136 days", duties: "$22 approx" },
      UK: { delivery: "6\u201310 days", duties: "$38 approx" },
    },
    supplier: {
      name: "ABC Exports",
      initials: "AE",
      country: "India",
      verified: true,
      responseTime: "Usually responds within 4 hours",
    },
    shipping: {
      readyToShip: "3\u20135 business days",
      shippedFrom: "Chennai Port, India",
      incoterms: "FOB, CIF, EXW available",
    },
  },
};

export const featuredSuppliers = [
  {
    id: "fs-1",
    name: "ABC Exports",
    initials: "AE",
    country: "India",
    verified: true,
    categories: "Spices \u00B7 Agriculture",
  },
  {
    id: "fs-2",
    name: "XYZ Traders",
    initials: "XT",
    country: "India",
    verified: true,
    categories: "Textiles",
  },
  {
    id: "fs-3",
    name: "India Crafts",
    initials: "IC",
    country: "India",
    verified: true,
    categories: "Handicrafts",
  },
];

export const howItWorksSteps = [
  {
    id: "step-1",
    step: "01",
    title: "Search",
    description: "Find verified suppliers by product, HS code or destination country.",
  },
  {
    id: "step-2",
    step: "02",
    title: "Quote",
    description: "Request a quote or buy directly with transparent bulk pricing.",
  },
  {
    id: "step-3",
    step: "03",
    title: "Export Delivered",
    description: "We handle documentation, logistics and tracking to your door.",
  },
];

export const testimonials = [
  {
    id: "t-1",
    quote:
      "ExportHub made it simple to source verified spice suppliers and get our shipment out within two weeks.",
    author: "Maria Alvarez",
    role: "Procurement Lead, Buenavista Foods (Mexico)",
  },
  {
    id: "t-2",
    quote:
      "The RFQ tool let us compare quotes from three suppliers side by side. Saved us days of back and forth emails.",
    author: "Daniel Osei",
    role: "Founder, Osei Trading Co. (Ghana)",
  },
  {
    id: "t-3",
    quote:
      "Trade Assurance gave us the confidence to place our first bulk textile order with a new supplier.",
    author: "Wei Chen",
    role: "Sourcing Manager, Chen Home Goods (Singapore)",
  },
];
