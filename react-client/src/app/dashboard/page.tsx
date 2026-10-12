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
  const role = resolveRole(roleParam);

  return (
    <DashboardLayout
      role={role}
      activeKey={ACTIVE_KEY[role]}
      section="Products"
    >
      <ProductsWorkspace />
    </DashboardLayout>
  );
}
