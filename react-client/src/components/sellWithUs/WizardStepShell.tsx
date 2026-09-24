import type { ReactNode } from "react";

export interface WizardStepShellProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

// Shared chrome for every wizard step: title, optional subtitle, and a
// consistent field stack. Keeps each step file focused on its own fields.
export default function WizardStepShell({ title, subtitle, children }: WizardStepShellProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="font-heading font-bold text-ink text-[18px] leading-[1.2]">
          {title}
        </h2>
        {subtitle && (
          <p className="font-body mt-1 text-text-dim text-[13px]">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
