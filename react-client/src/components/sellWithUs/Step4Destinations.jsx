import WizardStepShell from "@/components/sellWithUs/WizardStepShell";
import FieldError from "@/components/sellWithUs/FieldError";
import { destinationCountries, sellWithUsMeta } from "@/data/sellWithUs";

// Step 4: destination checklist. At least one destination is required —
// this is the step that blocks Next with sellWithUsMeta.destinationsError.
export function validateDestinations(values) {
  const errors = {};

  if (!values.destinations || values.destinations.length === 0) {
    errors.destinations = sellWithUsMeta.destinationsError;
  }

  return errors;
}

export default function Step4Destinations({ values, errors, onChange }) {
  const selected = values.destinations ?? [];

  function toggleDestination(id) {
    const next = selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id];
    onChange("destinations", next);
  }

  return (
    <WizardStepShell
      title="Where do you want to sell?"
      subtitle="Pick every destination market you're ready to export to."
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="font-body text-text-dim text-[12px] mb-1">
          Destination countries
        </legend>
        {destinationCountries.map((country) => {
          const checked = selected.includes(country.id);
          return (
            <label
              key={country.id}
              htmlFor={`destination-${country.id}`}
              className={[
                "flex items-center gap-3 rounded border px-3 py-[10px] cursor-pointer transition-colors",
                checked ? "border-saffron bg-saffron-soft" : "border-line bg-panel",
              ].join(" ")}
            >
              <input
                id={`destination-${country.id}`}
                type="checkbox"
                checked={checked}
                onChange={() => toggleDestination(country.id)}
                className="h-4 w-4 accent-saffron"
              />
              <span className="font-body text-text text-[13px]">
                {country.label}
              </span>
            </label>
          );
        })}
        <FieldError message={errors.destinations} />
      </fieldset>
    </WizardStepShell>
  );
}
