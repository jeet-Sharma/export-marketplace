import { useFormContext } from "react-hook-form";
import Input from "@/components/ui/Input";
import WizardStepShell from "@/components/sellWithUs/WizardStepShell";
import FieldError from "@/components/sellWithUs/FieldError";
import type { SellWithUsFormValues } from "@/types/sell-with-us";

// Step 1: account credentials. Validation rules live in
// lib/sell-with-us-schemas.ts (accountSchema) — this component only
// renders fields and reads errors from the shared react-hook-form context
// provided by SellWithUsWizard.tsx.
export default function Step1Account() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SellWithUsFormValues>();

  return (
    <WizardStepShell
      title="Create your account"
      subtitle="This is how you'll sign in to manage your vendor account."
    >
      <div className="flex flex-col gap-1">
        <Input
          id="account-name"
          label="Full name"
          placeholder="Jane Doe"
          autoComplete="name"
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="account-email"
          label="Email"
          type="email"
          placeholder="jane@company.com"
          autoComplete="email"
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="account-phone"
          label="Phone number"
          type="tel"
          placeholder="+91 98765 43210"
          autoComplete="tel"
          {...register("phone")}
        />
        <FieldError message={errors.phone?.message} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="account-password"
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="account-confirm-password"
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        <FieldError message={errors.confirmPassword?.message} />
      </div>
    </WizardStepShell>
  );
}
