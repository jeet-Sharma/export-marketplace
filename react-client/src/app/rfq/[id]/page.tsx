import RfqDetailScreen from "@/components/buyer/rfq/RfqDetailScreen";

export default async function Page({ params }: PageProps<"/rfq/[id]">) {
  const { id } = await params;
  return <RfqDetailScreen rfqId={id} />;
}
