import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout";
import { resolveRole } from "@/features/dashboard/config/resolveRole";
import { ProductsWorkspace } from "@/features/dashboard/products/ProductsWorkspace";

type ProductsPageProps = {
  searchParams: Promise<{ role?: string }>;
};

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const { role: roleParam } = await searchParams;
  const role = resolveRole(roleParam);

  return (
    <DashboardLayout role={role} activeKey="products" section="Products">
      <ProductsWorkspace />
    </DashboardLayout>
  );
}
