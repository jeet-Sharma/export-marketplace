import Link from "next/link";
import Button from "@/components/ui/Button";
import { appBrand } from "@/config/navigation";

// Public site header: brand, primary nav, auth actions and the vendor
// onboarding CTA. Distinct from the vendor Sidebar/PageHeader — this is the
// top-level marketing nav shown on "/" only.
export default function PublicHeader() {
  return (
    <header className="bg-panel border-b border-line">
      <div className="w-full px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-heading font-bold text-ink text-[18px] shrink-0">
            {appBrand.name}
          </Link>

          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-6 font-body text-text text-[13px]"
          >
            <Link href="/" className="hover:text-saffron">
              Categories
            </Link>
            <Link href="/" className="hover:text-saffron">
              Suppliers
            </Link>
            <Link href="/" className="hover:text-saffron">
              RFQ
            </Link>
            <Link href="/" className="hover:text-saffron">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Login
            </Button>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Signup
            </Button>
            <Link href="/sell-with-us">
              <Button variant="accent" size="sm">
                Sell with us
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
