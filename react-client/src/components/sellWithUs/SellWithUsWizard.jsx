"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import WizardProgress from "@/components/sellWithUs/WizardProgress";
import Step1Account, { validateAccount } from "@/components/sellWithUs/Step1Account";
import Step2Company, { validateCompany } from "@/components/sellWithUs/Step2Company";
import Step3Source, { validateSource } from "@/components/sellWithUs/Step3Source";
import Step4Destinations, {
  validateDestinations,
} from "@/components/sellWithUs/Step4Destinations";
import Step5Documents, { validateDocuments } from "@/components/sellWithUs/Step5Documents";
import Step6Review from "@/components/sellWithUs/Step6Review";
import ThankYouScreen from "@/components/sellWithUs/ThankYouScreen";
import { wizardSteps, sellWithUsMeta } from "@/data/sellWithUs";

const INITIAL_VALUES = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  legalName: "",
  gstNumber: "",
  iecNumber: "",
  address: "",
  sourceCountry: "",
  destinations: [],
  documents: {},
};

// Per-step field components and their validators, in wizard order. Keeping
// this list in one place is what lets the container stay generic — it
// doesn't know anything about GSTIN formats or destination checklists,
// just "step N has a component and a validate fn".
const STEP_COMPONENTS = [Step1Account, Step2Company, Step3Source, Step4Destinations, Step5Documents, Step6Review];
const STEP_VALIDATORS = [
  validateAccount,
  validateCompany,
  validateSource,
  validateDestinations,
  validateDocuments,
  () => ({}),
];

export default function SellWithUsWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return <ThankYouScreen />;
  }

  const isLastStep = currentStep === wizardSteps.length - 1;
  const StepComponent = STEP_COMPONENTS[currentStep];

  function handleChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleNext() {
    const validate = STEP_VALIDATORS[currentStep];
    const stepErrors = validate(values);

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    setCurrentStep((step) => Math.min(step + 1, wizardSteps.length - 1));
  }

  function handleBack() {
    setErrors({});
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function handleSubmit() {
    // No backend wired up yet — the signup data lives only in this
    // component's state. Submitting just transitions to the waiting screen.
    setSubmitted(true);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading font-bold text-ink text-[26px] leading-[1.2]">
          {sellWithUsMeta.heading}
        </h1>
        <p className="font-body mt-1 text-text-dim text-[14px]">
          {sellWithUsMeta.subheading}
        </p>
      </div>

      <WizardProgress steps={wizardSteps} currentStep={currentStep} />

      <div className="bg-panel border border-line rounded px-5 py-6 sm:px-8 sm:py-8">
        <StepComponent values={values} errors={errors} onChange={handleChange} />
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="md"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Back
        </Button>

        {isLastStep ? (
          <Button variant="accent" size="md" onClick={handleSubmit}>
            Submit application
          </Button>
        ) : (
          <Button variant="primary" size="md" onClick={handleNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
