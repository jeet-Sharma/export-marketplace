import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StoreProvider } from "@/store/StoreProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Looma · Market Bloom",
  description: "Export marketplace connecting international buyers with exporters.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {/*
         * StoreProvider is the single client-side data provider (Redux +
         * RTK Query). TanStack QueryProvider has been removed — all
         * server-state queries (products, categories, countries) now use
         * baseApi.injectEndpoints so there's one cache, one base-URL config
         * and one auth-header setup (frontend-rules #11).
         */}
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
