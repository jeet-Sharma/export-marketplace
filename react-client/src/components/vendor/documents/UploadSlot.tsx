import Button from "@/components/ui/Button";

export interface UploadSlotProps {
  missingCount?: number;
  onUpload?: () => void;
}

// Dashed drop target for missing documents. Visual only — there is no
// upload endpoint or object storage wired up yet, so onUpload is optional
// and the button is disabled when it isn't provided.
export default function UploadSlot({ missingCount = 0, onUpload }: UploadSlotProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-6 text-center bg-panel border border-dashed border-saffron rounded">
      <p className="font-heading font-semibold text-ink text-[14px]">
        {missingCount > 0
          ? `${missingCount} documents still required`
          : "All required documents uploaded"}
      </p>
      <p className="font-body text-text-dim text-[12px]">
        PDF, JPG or PNG up to 10 MB each.
      </p>
      <Button variant="accent" size="md" onClick={onUpload} disabled={!onUpload}>
        Upload Document
      </Button>
    </div>
  );
}
