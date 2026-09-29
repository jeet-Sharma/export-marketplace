"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "@/components/ui/Button";
import WizardProgress from "@/components/sellWithUs/WizardProgress";
import Step1Account from "@/components/sellWithUs/Step1Account";
import Step2Company from "@/components/sellWithUs/Step2Company";
import Step3Source from "@/components/sellWithUs/Step3Source";
import Step4Destinations from "@/components/sellWithUs/Step4Destinations";
import Step5Documents from "@/components/sellWithUs/Step5Documents";
import Step6Review from "@/components/sellWithUs/Step6Review";
import ThankYouScreen from "@/components/sellWithUs/ThankYouScreen";
import { wizardSteps, sellWithUsMeta } from "@/data/sellWithUs";
import { sellWithUsSchema } from "@/lib/sell-with-us-schemas";
import type { SellWithUsFormValues, SellWithUsStepFields } from "@/types/sell-with-us";
import type { ComponentType } from "react";

const INITIAL_VALUES: SellWithUsFormValues = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  legalName: "",
  gstNumber: "",
  iecNumber: "",
  companyPhone: "",
  companyEmail: "",
  address: "",
  sourceCountry: "",
  destinations: [],
  documents: {},
};

// Per-step field components, in wizard order. Keeping this list in one
// place is what lets the container stay generic — it doesn't know
// anything about GSTIN formats or destination checklists, just "step N
// has a component and owns these fields".
const STEP_COMPONENTS: ComponentType[] = [
  Step1Account,
  Step2Company,
  Step3Source,
  Step4Destinations,
  Step5Documents,
  Step6Review,
];

// Field names each step is responsible for — used to scope
// react-hook-form's `trigger()` call on "Next" so only the current step's
// fields are validated, not the whole multi-step form at once. Step 6
// (Review) has no fields of its own, it only reads earlier ones.
const STEP_FIELDS: SellWithUsStepFields[] = [
  ["name", "email", "phone", "password", "confirmPassword"],
  ["legalName", "gstNumber", "iecNumber", "companyPhone", "companyEmail", "address"],
  ["sourceCountry"],
  ["destinations"],
  ["documents"],
  [],
];

export default function SellWithUsWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<SellWithUsFormValues>({
    resolver: zodResolver(sellWithUsSchema),
    defaultValues: INITIAL_VALUES,
    mode: "onSubmit",
  });

  const { handleSubmit, trigger } = form;

  if (submitted) {
    return <ThankYouScreen />;
  }

  const isLastStep = currentStep === wizardSteps.length - 1;
  const StepComponent = STEP_COMPONENTS[currentStep];

  async function handleNext() {
    const fieldsToValidate = STEP_FIELDS[currentStep];
    const isStepValid = await trigger(fieldsToValidate as (keyof SellWithUsFormValues)[]);

    if (!isStepValid) return;

    setCurrentStep((step) => Math.min(step + 1, wizardSteps.length - 1));
  }

  function handleBack() {
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function onSubmit() {
    // No backend wired up yet — the signup data lives only in this
    // component's state. Submitting just transitions to the waiting screen.
    setSubmitted(true);
  }

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-col gap-8"
        onSubmit={isLastStep ? handleSubmit(onSubmit) : (event) => event.preventDefault()}
        noValidate
      >
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
          <StepComponent />
        </div>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>

          {isLastStep ? (
            <Button variant="accent" size="md" type="submit">
              Submit application
            </Button>
          ) : (
            <Button variant="primary" size="md" type="button" onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
