import WizardStepShell from "@/components/sellWithUs/WizardStepShell";
import DocumentUploadRow from "@/components/sellWithUs/DocumentUploadRow";
import { requiredDocuments } from "@/data/sellWithUs";
import type { SellWithUsFormErrors, WizardStepProps, WizardStepValidator } from "@/types/sell-with-us";

// Step 5: required document uploads (GST certificate, IEC certificate).
// Files live in values.documents keyed by document id, e.g.
// { "gst-certificate": File, "iec-certificate": File }.
export const validateDocuments: WizardStepValidator = (values) => {
  const errors: SellWithUsFormErrors = {};
  const documents = values.documents;

  requiredDocuments.forEach((doc) => {
    if (!documents[doc.id]) {
      errors[doc.id] = `Upload your ${doc.label.toLowerCase()}`;
    }
  });

  return errors;
};

export default function Step5Documents({ values, errors, onChange }: WizardStepProps) {
  const documents = values.documents;

  function handleFileChange(docId: string, file: File | null) {
    onChange("documents", { ...documents, [docId]: file ?? undefined });
  }

  return (
    <WizardStepShell
      title="Upload your documents"
      subtitle="We need these to verify your business before approval."
    >
      {requiredDocuments.map((doc) => (
        <DocumentUploadRow
          key={doc.id}
          id={doc.id}
          label={doc.label}
          helpText={doc.helpText}
          file={documents[doc.id] ?? null}
          onFileChange={(file) => handleFileChange(doc.id, file)}
          error={errors[doc.id]}
        />
      ))}
    </WizardStepShell>
  );
}
