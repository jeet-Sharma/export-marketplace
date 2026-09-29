import { useFormContext } from "react-hook-form";
import Input from "@/components/ui/Input";
import WizardStepShell from "@/components/sellWithUs/WizardStepShell";
import FieldError from "@/components/sellWithUs/FieldError";
import type { SellWithUsFormValues } from "@/types/sell-with-us";

// Step 2: company legal identity. Validation rules (GSTIN/IEC format
// checks etc) live in lib/sell-with-us-schemas.ts (companySchema).
export default function Step2Company() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SellWithUsFormValues>();

  return (
    <WizardStepShell
      title="Company details"
      subtitle="Used to verify your business before you go live."
    >
      <div className="flex flex-col gap-1">
        <Input
          id="company-legal-name"
          label="Company legal name"
          placeholder="ABC Exports Private Limited"
          {...register("legalName")}
        />
        <FieldError message={errors.legalName?.message} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Input
            id="company-gst"
            label="GST number"
            placeholder="33ABCDE1234F1Z5"
            {...register("gstNumber")}
          />
          <FieldError message={errors.gstNumber?.message} />
        </div>

        <div className="flex flex-col gap-1">
          <Input
            id="company-iec"
            label="IEC number"
            placeholder="0414512345"
            {...register("iecNumber")}
          />
          <FieldError message={errors.iecNumber?.message} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Input
            id="company-phone"
            label="Phone number"
            type="tel"
            placeholder="+91 98765 43210"
            autoComplete="tel"
            {...register("companyPhone")}
          />
          <FieldError message={errors.companyPhone?.message} />
        </div>

        <div className="flex flex-col gap-1">
          <Input
            id="company-email"
            label="Email ID"
            type="email"
            placeholder="contact@company.com"
            autoComplete="email"
            {...register("companyEmail")}
          />
          <FieldError message={errors.companyEmail?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="company-address"
          label="Registered address"
          placeholder="Plot 44, Industrial Estate, Erode, Tamil Nadu 638003, India"
          {...register("address")}
        />
        <FieldError message={errors.address?.message} />
      </div>
    </WizardStepShell>
  );
}
