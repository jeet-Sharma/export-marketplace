import colors from "@/theme/colors";
import Button from "@/components/ui/Button";
import { cellStyle } from "@/components/ui/Table";
import StatusPill from "@/components/vendor/StatusPill";

// One catalog row: product identity tile, commercial terms, workflow stage,
// status pill and the stage-appropriate action.
export default function ProductRow({ product }) {
  return (
    <tr>
      <td className="px-4 py-3" style={cellStyle()}>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center"
            style={{
              backgroundColor: colors.saffronSoft,
              border: `1px solid ${colors.line}`,
              borderRadius: "3px",
              width: "30px",
              height: "30px",
              fontSize: "15px",
            }}
            aria-hidden="true"
          >
            {product.emoji}
          </span>
          <span className="flex flex-col">
            <span
              className="font-heading font-semibold"
              style={{ color: colors.saffron, fontSize: "13px" }}
            >
              {product.name}
            </span>
            <span
              className="font-body"
              style={{ color: colors.textDim, fontSize: "11px" }}
            >
              {product.origin} {"\u2192"} {product.market}
            </span>
          </span>
        </div>
      </td>
      <td className="px-4 py-3 font-heading font-medium" style={cellStyle()}>
        {product.price}
      </td>
      <td className="px-4 py-3" style={cellStyle()}>
        {product.moq}
      </td>
      <td className="px-4 py-3 font-heading" style={cellStyle()}>
        {product.hsCode}
      </td>
      <td className="px-4 py-3" style={cellStyle()}>
        {product.stage}
      </td>
      <td className="px-4 py-3" style={cellStyle()}>
        <StatusPill status={product.status} />
      </td>
      <td className="px-4 py-3" style={cellStyle()}>
        <Button variant="ghost" size="sm">
          {product.action}
        </Button>
      </td>
    </tr>
  );
}
