/**
 * Section-jump tabs matching the Figma "Product details / Specifications /
 * Shipping & duties / Supplier" row. These are real in-page anchor links
 * (`<a href="#section-id">`), not fake decorative tabs. Specifications
 * and Shipping & duties sections always render on the page now (missing
 * field values show "—" instead of hiding the section), so these tabs
 * always render too.
 */
export function ProductDetailTabs() {
  return (
    <nav className="flex w-full gap-[30px] border-b border-border text-[14px]">
      <a
        href="#product-details"
        className="border-b-[3px] border-pink py-[13px] font-bold text-pink"
      >
        Product details
      </a>
      <a href="#specifications" className="py-[13px] font-semibold text-ink/60 hover:text-ink">
        Specifications
      </a>
      <a href="#shipping-duties" className="py-[13px] font-semibold text-ink/60 hover:text-ink">
        Shipping &amp; duties
      </a>
      <a href="#supplier" className="py-[13px] font-semibold text-ink/60 hover:text-ink">
        Supplier
      </a>
    </nav>
  );
}
