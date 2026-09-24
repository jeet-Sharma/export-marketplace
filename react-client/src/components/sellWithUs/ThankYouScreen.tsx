import Badge from "@/components/ui/Badge";
import { sellWithUsMeta } from "@/data/sellWithUs";

// Terminal state after a vendor submits their application. Deliberately
// does not redirect into the vendor dashboard — the account isn't approved
// yet, so there's nothing there for them until review completes.
export default function ThankYouScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <Badge tone="saffron">Application received</Badge>
      <h1 className="font-heading font-bold text-ink text-[24px] leading-[1.2] max-w-md">
        {sellWithUsMeta.thankYouTitle}
      </h1>
      <p className="font-body text-text-dim text-[14px] max-w-md">
        {sellWithUsMeta.thankYouBody}
      </p>
    </div>
  );
}
