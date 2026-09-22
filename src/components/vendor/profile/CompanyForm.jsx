import colors from "@/theme/colors";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import { profileFields, profileMeta } from "@/data/profile";

// Read-only company details with an Edit affordance. Fields come from
// seed data; editing is not wired up because there is no companies API yet.
export default function CompanyForm() {
  return (
    <Panel
      title={profileMeta.companyPanelTitle}
      action={
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      }
      bodyClassName="p-4"
    >
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {profileFields.map((field) => (
          <div key={field.id} className="flex flex-col gap-1">
            <dt
              className="font-body"
              style={{ color: colors.textDim, fontSize: "12px" }}
            >
              {field.label}
            </dt>
            <dd
              className="font-heading font-medium"
              style={{ color: colors.text, fontSize: "13px" }}
            >
              {field.value}
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
