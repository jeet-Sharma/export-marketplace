import Input from "@/components/ui/Input";
import WizardStepShell from "@/components/sellWithUs/WizardStepShell";
import FieldError from "@/components/sellWithUs/FieldError";

// Step 2: company legal identity. GST and IEC follow the same real-world
// format checks used elsewhere in the app's profile data (see
// data/profile.js for reference values).
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const IEC_PATTERN = /^[A-Z0-9]{10}$/;

export function validateCompany(values) {
  const errors = {};

  if (!values.legalName?.trim()) {
    errors.legalName = "Enter the company's legal name";
  }

  if (!values.gstNumber?.trim()) {
    errors.gstNumber = "Enter the GST number";
  } else if (!GSTIN_PATTERN.test(values.gstNumber.trim().toUpperCase())) {
    errors.gstNumber = "Enter a valid 15-character GSTIN";
  }

  if (!values.iecNumber?.trim()) {
    errors.iecNumber = "Enter the IEC number";
  } else if (!IEC_PATTERN.test(values.iecNumber.trim().toUpperCase())) {
    errors.iecNumber = "Enter a valid 10-character IEC number";
  }

  if (!values.address?.trim()) {
    errors.address = "Enter the registered address";
  }

  return errors;
}

export default function Step2Company({ values, errors, onChange }) {
  return (
    <WizardStepShell
      title="Company details"
      subtitle="Used to verify your business before you go live."
    >
      <div className="flex flex-col gap-1">
        <Input
          id="company-legal-name"
          label="Company legal name"
          value={values.legalName}
          onChange={(event) => onChange("legalName", event.target.value)}
          placeholder="ABC Exports Private Limited"
        />
        <FieldError message={errors.legalName} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="company-gst"
          label="GST number"
          value={values.gstNumber}
          onChange={(event) => onChange("gstNumber", event.target.value)}
          placeholder="33ABCDE1234F1Z5"
        />
        <FieldError message={errors.gstNumber} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="company-iec"
          label="IEC number"
          value={values.iecNumber}
          onChange={(event) => onChange("iecNumber", event.target.value)}
          placeholder="0414512345"
        />
        <FieldError message={errors.iecNumber} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="company-address"
          label="Registered address"
          value={values.address}
          onChange={(event) => onChange("address", event.target.value)}
          placeholder="Plot 44, Industrial Estate, Erode, Tamil Nadu 638003, India"
        />
        <FieldError message={errors.address} />
      </div>
    </WizardStepShell>
  );
}
