/** One step in the "Sell With Us" onboarding wizard's progress tracker. */
export interface WizardStep {
  id: string;
  label: string;
}

/** One selectable country (source or destination) in the wizard. */
export interface WizardCountry {
  id: string;
  label: string;
}

/** One required document upload slot in the wizard. */
export interface RequiredDocument {
  id: string;
  label: string;
  helpText: string;
}

/** Files attached during Step 5, keyed by RequiredDocument.id. */
export type WizardDocumentFiles = Record<string, File | undefined>;

/** All field values collected across the wizard's 6 steps. */
export interface SellWithUsFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  legalName: string;
  gstNumber: string;
  iecNumber: string;
  address: string;
  sourceCountry: string;
  /** Selected destination country ids (WizardCountry.id values). */
  destinations: string[];
  documents: WizardDocumentFiles;
}

/**
 * Validation errors for the wizard. Most keys are SellWithUsFormValues
 * field names, but Step 5 (Documents) keys its errors by RequiredDocument
 * id instead (e.g. "gst-certificate") since each required document needs
 * its own independent error message, not one shared field-level error.
 */
export type SellWithUsFormErrors = Partial<Record<keyof SellWithUsFormValues, string>> &
  Record<string, string | undefined>;

/**
 * Standard prop shape every wizard step component receives. Every step
 * gets the full form state (not just the fields it owns) because Step 6
 * (Review) needs to read fields set on every earlier step — this mirrors
 * how the values were already threaded through at runtime, just typed now.
 */
export interface WizardStepProps {
  values: SellWithUsFormValues;
  errors: SellWithUsFormErrors;
  onChange: <K extends keyof SellWithUsFormValues>(
    field: K,
    value: SellWithUsFormValues[K],
  ) => void;
}

/** A step's validate function: given the current values, return its errors. */
export type WizardStepValidator = (values: SellWithUsFormValues) => SellWithUsFormErrors;
