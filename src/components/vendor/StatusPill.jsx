import Badge from "@/components/ui/Badge";
import { statusTokens } from "@/theme/colors";

// Maps an order/product/inventory/RFQ/document status key to its Badge tone.
// pending=saffron, approved/delivered=teal, shipped=blueGrey, rejected/low=coral
export default function StatusPill({ status }) {
  const token = statusTokens[status];

  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `StatusPill: unknown status "${status}". Add it to statusTokens in ` +
          `src/theme/colors.js or this pill will render nothing.`,
      );
    }
    return null;
  }

  return <Badge tone={token.tone}>{token.label}</Badge>;
}
