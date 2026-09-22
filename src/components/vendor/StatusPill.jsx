import Badge from "@/components/ui/Badge";
import { statusTokens } from "@/theme/colors";

// Maps an order/alert status to its token pair from colors.js.
// pending=saffron, approved/delivered=teal, shipped=blueGrey, rejected/low=coral
export default function StatusPill({ status }) {
  const token = statusTokens[status];

  if (!token) return null;

  return (
    <Badge fg={token.fg} bg={token.bg}>
      {token.label}
    </Badge>
  );
}
