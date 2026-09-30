import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import { buyerProfileFields, buyerProfileMeta } from "@/data/buyerProfile";

export interface AddressFormProps {
  onEdit?: () => void;
}

// Read-only contact/shipping details with an Edit affordance — mirrors
// vendor/profile/CompanyForm.tsx exactly (same Panel+dl grid+disabled-
// until-wired Edit button), reading buyer fields instead of company ones.
export default function AddressForm({ onEdit }: AddressFormProps) {
  return (
    <Panel
      title={buyerProfileMeta.profilePanelTitle}
      action={
        <Button variant="ghost" size="sm" onClick={onEdit} disabled={!onEdit}>
          Edit
        </Button>
      }
      bodyClassName="p-4"
    >
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {buyerProfileFields.map((field) => (
          <div key={field.id} className="flex flex-col gap-1">
            <dt className="font-body text-text-dim text-[12px]">{field.label}</dt>
            <dd className="font-heading font-medium text-text text-[13px]">{field.value}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
