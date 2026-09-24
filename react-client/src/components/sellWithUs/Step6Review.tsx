import Badge from "@/components/ui/Badge";
import WizardStepShell from "@/components/sellWithUs/WizardStepShell";
import {
  sourceCountries,
  destinationCountries,
  requiredDocuments,
} from "@/data/sellWithUs";
import type { WizardStepProps } from "@/types/sell-with-us";

// Step 6: read-only summary of every prior step, pulled live from wizard
// state — nothing here is re-entered, it all reflects what was typed /
// picked / uploaded on steps 1-5. Submit is rendered by the wizard
// container's footer, not here, so it stays consistent with the
// Back/Next buttons on every other step.
interface ReviewRowProps {
  label: string;
  value: string;
}

function ReviewRow({ label, value }: ReviewRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-line last:border-b-0">
      <span className="font-body text-text-dim text-[12px]">{label}</span>
      <span className="font-body text-text text-[13px] text-right">{value}</span>
    </div>
  );
}

// Accepts the full WizardStepProps (even though only `values` is read) so
// this stays interchangeable with the other steps in SellWithUsWizard's
// STEP_COMPONENTS array — a consistent interface for a consistent list,
// rather than a special-cased signature that would need a cast to fit.
export default function Step6Review({ values }: WizardStepProps) {
  const sourceLabel =
    sourceCountries.find((country) => country.id === values.sourceCountry)?.label ??
    "\u2014";

  const selectedDestinations = destinationCountries.filter((country) =>
    values.destinations.includes(country.id),
  );

  return (
    <WizardStepShell
      title="Review your application"
      subtitle="Double-check everything before you submit."
    >
      <section className="rounded border border-line bg-panel px-4 py-1">
        <h3 className="font-heading font-semibold text-text text-[13px] pt-3 pb-1">
          Account
        </h3>
        <ReviewRow label="Name" value={values.name || "\u2014"} />
        <ReviewRow label="Email" value={values.email || "\u2014"} />
      </section>

      <section className="rounded border border-line bg-panel px-4 py-1">
        <h3 className="font-heading font-semibold text-text text-[13px] pt-3 pb-1">
          Company
        </h3>
        <ReviewRow label="Legal name" value={values.legalName || "\u2014"} />
        <ReviewRow label="GST number" value={values.gstNumber || "\u2014"} />
        <ReviewRow label="IEC number" value={values.iecNumber || "\u2014"} />
        <ReviewRow label="Address" value={values.address || "\u2014"} />
      </section>

      <section className="rounded border border-line bg-panel px-4 py-1">
        <h3 className="font-heading font-semibold text-text text-[13px] pt-3 pb-1">
          Source
        </h3>
        <ReviewRow label="Source country" value={sourceLabel} />
      </section>

      <section className="rounded border border-line bg-panel px-4 py-3">
        <h3 className="font-heading font-semibold text-text text-[13px] pb-2">
          Destinations
        </h3>
        {selectedDestinations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedDestinations.map((country) => (
              <Badge key={country.id} tone="teal">
                {country.label}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="font-body text-coral text-[12px]">
            No destinations selected.
          </p>
        )}
      </section>

      <section className="rounded border border-line bg-panel px-4 py-1">
        <h3 className="font-heading font-semibold text-text text-[13px] pt-3 pb-1">
          Documents
        </h3>
        {requiredDocuments.map((doc) => (
          <ReviewRow
            key={doc.id}
            label={doc.label}
            value={values.documents[doc.id]?.name ?? "Not uploaded"}
          />
        ))}
      </section>
    </WizardStepShell>
  );
}
