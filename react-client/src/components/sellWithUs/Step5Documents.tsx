import { useFormContext } from "react-hook-form";
import WizardStepShell from "@/components/sellWithUs/WizardStepShell";
import DocumentUploadRow from "@/components/sellWithUs/DocumentUploadRow";
import { requiredDocuments } from "@/data/sellWithUs";
import type { SellWithUsFormValues } from "@/types/sell-with-us";

// Step 5: required document uploads (GST certificate, IEC certificate).
// Files live in values.documents keyed by document id, e.g.
// { "gst-certificate": File, "iec-certificate": File }. Required-ness is
// enforced by lib/sell-with-us-schemas.ts (documentsSchema), which reports
// errors nested under `documents.<docId>` — read here via
// errors.documents?.[doc.id] since react-hook-form mirrors a record
// schema's shape in its error tree.
export default function Step5Documents() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<SellWithUsFormValues>();

  const documents = watch("documents");
  const documentErrors = errors.documents as
    | Record<string, { message?: string } | undefined>
    | undefined;

  function handleFileChange(docId: string, file: File | null) {
    setValue("documents", { ...documents, [docId]: file ?? undefined }, {
      shouldValidate: true,
    });
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
          error={documentErrors?.[doc.id]?.message}
        />
      ))}
    </WizardStepShell>
  );
}
