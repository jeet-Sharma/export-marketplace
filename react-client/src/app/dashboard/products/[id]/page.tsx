import { redirect } from "next/navigation";
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout";
import { resolveRole } from "@/features/dashboard/config/resolveRole";
import { ProductDetail } from "@/features/dashboard/products/ProductDetail";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ role?: string }>;
};

export default async function ProductDetailPage({
  params,
  searchParams,
}: ProductDetailPageProps) {
  const { id } = await params;
  const { role: roleParam } = await searchParams;
  const role = resolveRole(roleParam);

  // Same buyer guard as the list route — product management isn't a buyer view.
  if (role === "user") {
    redirect("/dashboard?role=user");
  }

  const roleQuery = `?role=${role}`;

  return (
    <DashboardLayout role={role} activeKey="products" section="Product detail">
      <ProductDetail
        productId={id}
        backHref={`/dashboard/products${roleQuery}`}
      />
    </DashboardLayout>
  );
}
