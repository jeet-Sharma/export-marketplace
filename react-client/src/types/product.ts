export interface Product {
  /** Path or absolute URL to the product image. */
  image: string;
  /**
   * Short promotional label shown on the image, e.g. "−19%" or "Bestseller".
   * Optional: real catalogue products from the API have no promotional
   * badge concept yet — only the curated homepage seed data sets this.
   */
  badge?: string;
  /** Origin city and country, e.g. "Aveiro, Portugal". */
  origin: string;
  /** Product title. */
  name: string;
  /**
   * Pre-formatted rating string, e.g. "★★★★★ 4.9 · 128". Optional: the
   * backend has no reviews/ratings feature yet.
   */
  rating?: string;
  /** Current price, e.g. "$42.00". */
  price: string;
  /** Optional original price shown with a strikethrough. */
  oldPrice?: string;
  /** Delivery estimate, e.g. "✓ Delivers in 5–8 days". */
  delivery?: string;
}
