// Shared shapes for the public marketing homepage (hero, categories,
// featured products/suppliers, how-it-works, testimonials). Kept separate
// from the product detail types in @/lib/products, which model the full
// product record rather than its homepage card summary.

export interface TrustBadge {
  id: string;
  label: string;
}

export interface HeroContent {
  eyebrow: string;
  headline: string;
  subheadline: string;
  searchPlaceholder: string;
  searchScopes: string[];
  trustBadges: TrustBadge[];
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  productCount: number;
}

/** Homepage card summary of a product — see @/lib/products Product for the full record. */
export interface FeaturedProduct {
  id: string;
  name: string;
  emoji: string;
  price: string;
  moq: string;
  supplierName: string;
  supplierVerified: boolean;
}

export interface FeaturedSupplier {
  id: string;
  name: string;
  initials: string;
  country: string;
  verified: boolean;
  categories: string;
}

export interface HowItWorksStep {
  id: string;
  step: string;
  title: string;
  description: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
}
