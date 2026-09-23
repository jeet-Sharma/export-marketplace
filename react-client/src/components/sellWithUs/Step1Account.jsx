import Input from "@/components/ui/Input";
import WizardStepShell from "@/components/sellWithUs/WizardStepShell";
import FieldError from "@/components/sellWithUs/FieldError";

// Step 1: account credentials. Validation rules:
// - name required
// - email required + must look like an email
// - password required, min 8 chars
// - confirm password required + must match password
export function validateAccount(values) {
  const errors = {};

  if (!values.name?.trim()) {
    errors.name = "Enter your full name";
  }

  if (!values.email?.trim()) {
    errors.email = "Enter your email address";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!values.password) {
    errors.password = "Enter a password";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your password";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match";
  }

  return errors;
}

export default function Step1Account({ values, errors, onChange }) {
  return (
    <WizardStepShell
      title="Create your account"
      subtitle="This is how you'll sign in to manage your vendor account."
    >
      <div className="flex flex-col gap-1">
        <Input
          id="account-name"
          label="Full name"
          value={values.name}
          onChange={(event) => onChange("name", event.target.value)}
          placeholder="Jane Doe"
          autoComplete="name"
        />
        <FieldError message={errors.name} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="account-email"
          label="Email"
          type="email"
          value={values.email}
          onChange={(event) => onChange("email", event.target.value)}
          placeholder="jane@company.com"
          autoComplete="email"
        />
        <FieldError message={errors.email} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="account-password"
          label="Password"
          type="password"
          value={values.password}
          onChange={(event) => onChange("password", event.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        <FieldError message={errors.password} />
      </div>

      <div className="flex flex-col gap-1">
        <Input
          id="account-confirm-password"
          label="Confirm password"
          type="password"
          value={values.confirmPassword}
          onChange={(event) => onChange("confirmPassword", event.target.value)}
          placeholder="Re-enter your password"
          autoComplete="new-password"
        />
        <FieldError message={errors.confirmPassword} />
      </div>
    </WizardStepShell>
  );
}
