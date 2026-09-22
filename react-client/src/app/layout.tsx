import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import BuyerLayout from "@/components/buyer/BuyerLayout";
import ThemeStyles from "@/theme/ThemeStyles";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ExportHub — Buyer Panel",
  description: "Source products, send RFQs and track orders on ExportHub.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} h-full`}
    >
      <head>
        <ThemeStyles />
      </head>
      <body className="min-h-full">
        <BuyerLayout>{children}</BuyerLayout>
      </body>
    </html>
  );
}
