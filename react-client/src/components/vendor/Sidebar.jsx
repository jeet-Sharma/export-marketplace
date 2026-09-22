"use client";

import { usePathname } from "next/navigation";
import { sidebarClasses } from "@/theme/colors";
import SidebarNavItem from "@/components/vendor/SidebarNavItem";
import { sidebarNav, appBrand, vendorCompany } from "@/config/navigation";

// Vendor sidebar: brand, panel label, grouped nav, company footer.
// Nav content comes entirely from config/navigation; the active row is
// derived from the current route so no page has to declare it.
export default function Sidebar({
  nav = sidebarNav,
  brand = appBrand,
  company = vendorCompany,
  className = "",
}) {
  const pathname = usePathname();
  return (
    <aside
      className={`flex flex-col w-[228px] border-r ${sidebarClasses.border} ${sidebarClasses.bg} ${className}`}
    >
      {/* Brand */}
      <div className={`px-4 py-4 border-b ${sidebarClasses.border}`}>
        <span className={`font-heading font-bold text-[18px] ${sidebarClasses.brand}`}>
          {brand.name}
        </span>
      </div>

      {/* Panel label */}
      <p
        className={`font-heading font-semibold px-4 pt-3 text-[10px] tracking-[0.14em] uppercase ${sidebarClasses.panelLabel}`}
      >
        {brand.panelLabel}
      </p>

      {/* Grouped navigation */}
      <nav aria-label="Vendor navigation" className="flex-1 mt-4">
        {nav.map((group) => (
          <div key={group.id} className="mb-5">
            <p
              className={`font-body px-4 pb-2 text-[10px] tracking-[0.12em] uppercase ${sidebarClasses.heading}`}
            >
              {group.heading}
            </p>
            <div className="flex flex-col">
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.id}
                  item={item}
                  active={isActiveRoute(pathname, item.href)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Company footer */}
      <div
        className={`flex items-center gap-3 px-4 py-3 border-t ${sidebarClasses.border} ${sidebarClasses.footerBg}`}
      >
        <span className="inline-flex items-center justify-center font-heading font-bold bg-blue-grey text-panel w-7 h-7 rounded text-[11px]">
          {company.initials}
        </span>
        <span className="flex flex-col">
          <span className={`font-heading font-semibold text-[12px] ${sidebarClasses.itemActive}`}>
            {company.name}
          </span>
          <span className="font-body text-saffron text-[11px]">
            {company.status}
          </span>
        </span>
      </div>
    </aside>
  );
}

// "/" only matches exactly; every other route also matches its subpaths
// so /products/new keeps the Products row highlighted.
function isActiveRoute(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
