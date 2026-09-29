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
  phone: string;
  password: string;
  confirmPassword: string;
  legalName: string;
  gstNumber: string;
  iecNumber: string;
  companyPhone: string;
  companyEmail: string;
  address: string;
  sourceCountry: string;
  /** Selected destination country ids (WizardCountry.id values). */
  destinations: string[];
  documents: WizardDocumentFiles;
}

/**
 * Field names belonging to each wizard step, used to scope
 * react-hook-form's `trigger()` call on "Next" to just that step's fields
 * instead of validating the whole multi-step form at once.
 */
export type SellWithUsStepFields = (keyof SellWithUsFormValues)[];
