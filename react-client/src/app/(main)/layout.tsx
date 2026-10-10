import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Footer } from "@/components/layout/Footer";

/**
 * Shared chrome for the public marketplace route group: site header
 * (concept bar, primary nav, category strip) and footer, wrapping every
 * page under `(main)`. Keeps page files focused on their own content —
 * new pages added under this group automatically get the same header/footer
 * without re-importing them.
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-cream font-sans">
      <SiteHeader />

      {children}

      <section className="flex flex-col bg-white">
        <Footer />
      </section>
    </div>
  );
}
