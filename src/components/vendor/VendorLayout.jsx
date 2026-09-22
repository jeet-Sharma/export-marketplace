import Sidebar from "@/components/vendor/Sidebar";

// Vendor shell: fixed-width sidebar beside a scrollable content column.
// Rendered once from app/layout.tsx so the sidebar survives navigation.
// The sidebar is hidden below lg so small screens get the full width.
export default function VendorLayout({ children }) {
  return (
    <div className="flex flex-1 min-h-screen">
      <Sidebar className="hidden lg:flex" />
      <div className="flex-1 min-w-0 flex flex-col bg-paper">{children}</div>
    </div>
  );
}
