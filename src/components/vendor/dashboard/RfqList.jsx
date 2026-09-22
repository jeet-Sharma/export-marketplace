import colors from "@/theme/colors";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import RfqCard from "@/components/vendor/dashboard/RfqCard";

export default function RfqList({ rfqs = [], title = "Pending RFQs" }) {
  return (
    <Panel
      title={title}
      action={<Badge tone="neutral">{rfqs.length} open</Badge>}
      bodyClassName="p-4"
    >
      <div className="flex flex-col gap-3">
        {rfqs.length === 0 ? (
          <p
            className="font-body"
            style={{ color: colors.textDim, fontSize: "13px" }}
          >
            No pending RFQs right now.
          </p>
        ) : (
          rfqs.map((rfq) => <RfqCard key={rfq.id} rfq={rfq} />)
        )}
      </div>

      <div className="mt-4">
        <Button variant="primary" size="md" className="w-full">
          View all RFQs
        </Button>
      </div>
    </Panel>
  );
}
