import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import { profileFields, profileMeta } from "@/data/profile";

export interface CompanyFormProps {
  onEdit?: () => void;
}

// Read-only company details with an Edit affordance. Fields come from
// seed data; editing is not wired up because there is no companies API yet,
// so the Edit button is disabled until a real handler is supplied.
export default function CompanyForm({ onEdit }: CompanyFormProps) {
  return (
    <Panel
      title={profileMeta.companyPanelTitle}
      action={
        <Button variant="ghost" size="sm" onClick={onEdit} disabled={!onEdit}>
          Edit
        </Button>
      }
      bodyClassName="p-4"
    >
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {profileFields.map((field) => (
          <div key={field.id} className="flex flex-col gap-1">
            <dt className="font-body text-text-dim text-[12px]">
              {field.label}
            </dt>
            <dd className="font-heading font-medium text-text text-[13px]">
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
