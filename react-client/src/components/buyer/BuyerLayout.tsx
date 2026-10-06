import type { ReactNode } from "react";
import Sidebar from "@/components/vendor/Sidebar";
import { buyerNav, buyerBrand, buyerCompany } from "@/config/navigation";

export interface BuyerLayoutProps {
  children: ReactNode;
}

// Buyer shell — identical structure to VendorLayout.tsx (fixed-width
// sidebar beside a scrollable content column, sidebar hidden below lg).
// Reuses the same Sidebar component as the vendor portal, just supplying
// buyer-specific nav/brand/company via its existing override props rather
// than forking the sidebar itself.
export default function BuyerLayout({ children }: BuyerLayoutProps) {
  return (
    <div className="flex flex-1 min-h-screen">
      <Sidebar
        nav={buyerNav}
        brand={buyerBrand}
        company={buyerCompany}
        navLabel="Buyer navigation"
        className="hidden lg:flex"
      />
      <div className="flex-1 min-w-0 flex flex-col bg-paper">{children}</div>
    </div>
  );
}
