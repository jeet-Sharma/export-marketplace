import { redirect } from "next/navigation";
import { Suspense } from "react";
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

  // The admin product-management workspace is not a buyer surface. A buyer
  // landing here (e.g. a shared link) is sent to their own home instead of
  // being shown catalog controls they shouldn't have.
  if (role === "user") {
    redirect("/dashboard?role=user");
  }

  return (
    <DashboardLayout role={role} activeKey="products" section="Products">
      <Suspense fallback={null}>
        <ProductsWorkspace role={role} />
      </Suspense>
    </DashboardLayout>
  );
}
