import colors from "@/theme/colors";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

// One RFQ entry: product + "New" pill, quantity / target price / destination.
export default function RfqCard({ rfq }) {
  const metaStyle = { color: colors.textDim, fontSize: "12px" };
  const valueStyle = { color: colors.text, fontSize: "13px" };

  return (
    <article
      className="p-4"
      style={{
        border: `1px solid ${colors.line}`,
        borderRadius: "3px",
        backgroundColor: colors.panel,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h4
          className="font-heading font-semibold"
          style={{ color: colors.ink, fontSize: "14px" }}
        >
          {rfq.product}
        </h4>
        {rfq.isNew && <Badge tone="saffron">New</Badge>}
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <dt className="font-body" style={metaStyle}>
            Quantity
          </dt>
          <dd className="font-heading font-medium mt-1" style={valueStyle}>
            {rfq.quantity}
          </dd>
        </div>
        <div>
          <dt className="font-body" style={metaStyle}>
            Target
          </dt>
          <dd className="font-heading font-medium mt-1" style={valueStyle}>
            {rfq.target}
          </dd>
        </div>
        <div>
          <dt className="font-body" style={metaStyle}>
            Destination
          </dt>
          <dd className="font-heading font-medium mt-1" style={valueStyle}>
            {rfq.country}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center gap-2">
        <Button variant="accent" size="sm">
          Send Quote
        </Button>
        <Button variant="ghost" size="sm">
          Details
        </Button>
      </div>
    </article>
  );
}
