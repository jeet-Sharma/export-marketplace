// Step tracker for the Sell With Us wizard: Account -> Company -> Source ->
// Destinations -> Documents -> Review. Purely presentational — the
// container owns which step index is current.
export default function WizardProgress({ steps, currentStep }) {
  return (
    <ol
      aria-label="Vendor signup progress"
      className="flex items-start justify-between gap-1"
    >
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <li key={step.id} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              <span
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${index + 1}: ${step.label}${
                  isComplete ? " (complete)" : isCurrent ? " (current)" : ""
                }`}
                className={[
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-heading font-semibold text-[12px] border",
                  isComplete
                    ? "bg-teal text-panel border-teal"
                    : isCurrent
                      ? "bg-saffron text-panel border-saffron"
                      : "bg-panel text-text-dim border-line",
                ].join(" ")}
              >
                {isComplete ? "\u2713" : index + 1}
              </span>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`h-[2px] flex-1 ${isComplete ? "bg-teal" : "bg-line"}`}
                />
              )}
            </div>
            <span
              className={`font-body text-center text-[11px] leading-[1.2] ${
                isCurrent ? "font-semibold text-ink" : "text-text-dim"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
