import OrderDetailScreen from "@/components/buyer/orders/OrderDetailScreen";

export default async function Page({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  return <OrderDetailScreen orderId={id} />;
}
