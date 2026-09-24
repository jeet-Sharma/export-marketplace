import Badge from "@/components/ui/Badge";
import { statusTokens } from "@/theme/colors";
import type { StatusKey } from "@/types/status";

export interface StatusPillProps {
  status: StatusKey;
}

// Maps an order/product/inventory/RFQ/document status key to its Badge tone.
// pending=saffron, approved/delivered=teal, shipped=blueGrey, rejected/low=coral
//
// statusTokens is typed as Record<StatusKey, StatusToken>, so every
// StatusKey the type system allows in is guaranteed to have a token. The
// runtime guard below stays anyway: `status` can still arrive as an
// untyped string at the JS/TS boundary (e.g. from seed/API data that
// doesn't actually satisfy StatusKey), and silently rendering nothing is
// safer than throwing on a page that's otherwise fine.
export default function StatusPill({ status }: StatusPillProps) {
  const token = statusTokens[status];

  if (!token) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `StatusPill: unknown status "${status}". Add it to statusTokens in ` +
          `src/theme/colors.ts or this pill will render nothing.`,
      );
    }
    return null;
  }

  return <Badge tone={token.tone}>{token.label}</Badge>;
}
