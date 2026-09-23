import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { statusTokens } from "@/theme/colors";

// Single upload row for a required document: label, help text, hidden
// native file input triggered by a button, and a status pill that flips
// from "missing" to "uploaded" once a file is attached.
export default function DocumentUploadRow({ id, label, helpText, file, onFileChange, error }) {
  const status = file ? statusTokens.uploaded : statusTokens.missing;
  const inputId = `document-upload-${id}`;

  return (
    <div className="flex flex-col gap-2 rounded border border-line bg-panel px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-heading font-semibold text-text text-[13px]">{label}</p>
          <p className="font-body text-text-dim text-[12px] mt-[2px]">{helpText}</p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor={inputId}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => document.getElementById(inputId)?.click()}
          >
            {file ? "Replace file" : "Choose file"}
          </Button>
        </label>
        <input
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        {file && (
          <span className="font-body text-text-dim text-[12px] truncate">
            {file.name}
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="font-body text-coral text-[12px]">
          {error}
        </p>
      )}
    </div>
  );
}
