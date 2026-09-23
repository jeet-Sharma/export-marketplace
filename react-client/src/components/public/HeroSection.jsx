import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { heroContent } from "@/data/public";

// Homepage hero: headline, multi-scope search bar and trust badge row.
// Ink background to anchor the page the same way the vendor sidebar anchors
// the dashboard shell.
export default function HeroSection() {
  return (
    <section className="bg-ink">
      <div className="w-full px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-[720px] mx-auto flex flex-col items-center gap-5 text-center">
          <Badge tone="saffron">{heroContent.eyebrow}</Badge>

          <h1 className="font-heading font-bold text-panel text-[30px] sm:text-[40px] leading-[1.15]">
            {heroContent.headline}
          </h1>

          <p className="font-body text-blue-grey-soft text-[15px] max-w-[560px]">
            {heroContent.subheadline}
          </p>

          <form className="w-full flex flex-col sm:flex-row gap-2 mt-2" role="search">
            <Input
              placeholder={heroContent.searchPlaceholder}
              adornment="\u{1F50D}"
              className="flex-1"
              aria-label="Search products, suppliers, HS code or country"
            />
            <Button variant="accent" size="md" type="submit" className="sm:w-auto">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
            {heroContent.searchScopes.map((scope) => (
              <Badge key={scope} tone="blueGrey">
                {scope}
              </Badge>
            ))}
          </div>

          <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {heroContent.trustBadges.map((badge) => (
              <div
                key={badge.id}
                className="bg-panel/5 border border-blue-grey rounded px-3 py-2 text-center"
              >
                <p className="font-body font-medium text-panel text-[12px]">
                  {badge.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
