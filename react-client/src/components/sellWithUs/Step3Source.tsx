import WizardStepShell from "@/components/sellWithUs/WizardStepShell";
import FieldError from "@/components/sellWithUs/FieldError";
import { sourceCountries } from "@/data/sellWithUs";
import type { SellWithUsFormErrors, WizardStepProps, WizardStepValidator } from "@/types/sell-with-us";

// Step 3: single-select source country (where the vendor ships from).
export const validateSource: WizardStepValidator = (values) => {
  const errors: SellWithUsFormErrors = {};

  if (!values.sourceCountry) {
    errors.sourceCountry = "Select your source country";
  }

  return errors;
};

export default function Step3Source({ values, errors, onChange }: WizardStepProps) {
  return (
    <WizardStepShell
      title="Where do you ship from?"
      subtitle="This is your primary sourcing / manufacturing country."
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor="source-country"
          className="font-body text-text-dim text-[12px]"
        >
          Source country
        </label>
        <select
          id="source-country"
          value={values.sourceCountry}
          onChange={(event) => onChange("sourceCountry", event.target.value)}
          className="font-body w-full bg-panel border border-line rounded px-[10px] py-[7px] text-text text-[13px] focus:outline-none focus:border-saffron"
        >
          <option value="">Select a country</option>
          {sourceCountries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.label}
            </option>
          ))}
        </select>
        <FieldError message={errors.sourceCountry} />
      </div>
    </WizardStepShell>
  );
}
