import Panel from "@/components/ui/Panel";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { buyerPaymentMethods, buyerProfileMeta } from "@/data/buyerProfile";
import type { PaymentMethod } from "@/types/profile";

export interface PaymentMethodsPanelProps {
  onAdd?: () => void;
  onRemove?: (method: PaymentMethod) => void;
}

// Saved payment methods list — mirrors vendor/profile/VerificationPanel.tsx's
// checklist layout (Panel + per-row action), swapping a verification
// checklist for saved cards/wallets.
export default function PaymentMethodsPanel({ onAdd, onRemove }: PaymentMethodsPanelProps) {
  return (
    <Panel
      title={buyerProfileMeta.paymentPanelTitle}
      action={
        <Button variant="ghost" size="sm" onClick={onAdd} disabled={!onAdd}>
          + Add
        </Button>
      }
      bodyClassName="p-4"
    >
      <ul className="flex flex-col gap-3">
        {buyerPaymentMethods.map((method) => (
          <li key={method.id} className="flex items-center justify-between gap-3">
            <span className="flex flex-col">
              <span className="font-heading font-semibold text-ink text-[13px]">
                {method.label}
              </span>
              <span className="font-body text-text-dim text-[12px]">{method.detail}</span>
            </span>
            <span className="flex items-center gap-2">
              {method.isDefault && <Badge tone="teal">Default</Badge>}
              <Button
                variant="danger"
                size="sm"
                onClick={() => onRemove?.(method)}
                disabled={!onRemove}
              >
                Remove
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
