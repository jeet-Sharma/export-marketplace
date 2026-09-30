import BuyerLayout from "@/components/buyer/BuyerLayout";

export default function BuyerRootLayout({ children }: LayoutProps<"/buyer">) {
  return <BuyerLayout>{children}</BuyerLayout>;
}
