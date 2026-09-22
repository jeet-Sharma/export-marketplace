import VendorLayout from "@/components/vendor/VendorLayout";

export default function VendorRootLayout({ children }: LayoutProps<"/vendor">) {
  return <VendorLayout>{children}</VendorLayout>;
}
