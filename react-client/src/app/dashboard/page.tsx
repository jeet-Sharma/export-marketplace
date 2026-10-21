import { Suspense } from "react";
import { cookies } from "next/headers";
import { BuyerWorkspace } from "@/features/dashboard/buyer/BuyerWorkspace";
import { AuthDebugLogger } from "@/features/dashboard/components/AuthDebugLogger";
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout";
import { resolveRole } from "@/features/dashboard/config/resolveRole";
import { ProductsWorkspace } from "@/features/dashboard/products/ProductsWorkspace";

// Active nav key per role — the user (buyer) role has no "products" item,
// so it highlights its market-browse entry instead.
const ACTIVE_KEY = {
  admin: "products",
  vendor: "products",
  user: "home",
} as const;

type DashboardPageProps = {
  searchParams: Promise<{ role?: string }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { role: roleParam } = await searchParams;

  // Resolve role from user_data cookie if no URL override query is provided
  const cookieStore = await cookies();
  const rawUserData = cookieStore.get("user_data")?.value;
  let sessionRole: string | undefined;

  if (rawUserData) {
    try {
      const parsed = JSON.parse(rawUserData);
      // Backend roles are e.g. ["admin"] or ["vendor"] or ["buyer"/"user"]
      sessionRole = parsed.roles?.[0]?.toLowerCase();
    } catch {
      // Fallback if parsing fails
    }
  }

  // Server-side terminal log
  console.log("🖥️ [Server /dashboard] access_token:", cookieStore.get("access_token")?.value);
  console.log("🖥️ [Server /dashboard] user_data:", rawUserData);

  const role = resolveRole(roleParam ?? sessionRole);
  const isBuyer = role === "user";
  const token = cookieStore.get("access_token")?.value;

  return (
    <DashboardLayout
      role={role}
      activeKey={ACTIVE_KEY[role]}
      section={isBuyer ? "Browse market" : "Products"}
    >
      {/* Logs cookies (access_token, user_data, permissions) to browser DevTools console */}
      <AuthDebugLogger />

      {isBuyer ? (
        <BuyerWorkspace />
      ) : (
        // ProductsWorkspace reads the list filters from the URL
        // (useSearchParams), which Next requires to sit under a Suspense
        // boundary.
        <Suspense fallback={null}>
          <ProductsWorkspace role={role} />
        </Suspense>
      )}
    </DashboardLayout>
  );
}
