import { useFormContext } from "react-hook-form";
import WizardStepShell from "@/components/sellWithUs/WizardStepShell";
import FieldError from "@/components/sellWithUs/FieldError";
import { destinationCountries } from "@/data/sellWithUs";
import type { SellWithUsFormValues } from "@/types/sell-with-us";

// Step 4: destination checklist. At least one destination is required —
// enforced by lib/sell-with-us-schemas.ts (destinationsSchema). Checkbox
// group backed by a string[] field, so selection is read/written via
// watch/setValue rather than a plain register() (which only maps 1:1 to a
// single input's value/checked).
export default function Step4Destinations() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SellWithUsFormValues>();

  const selected = watch("destinations");

  function toggleDestination(id: string) {
    const next = selected.includes(id)
      ? selected.filter((item) => item !== id)
      : [...selected, id];
    setValue("destinations", next, { shouldValidate: true });
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
        <FieldError message={errors.destinations?.message} />
      </fieldset>
    </WizardStepShell>
  );
}
