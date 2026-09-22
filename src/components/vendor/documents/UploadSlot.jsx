import colors from "@/theme/colors";
import Button from "@/components/ui/Button";

// Dashed drop target for missing documents. Visual only — there is no
// upload endpoint or object storage wired up yet.
export default function UploadSlot({ missingCount = 0 }) {
  return (
    <div
      className="flex flex-col items-center gap-2 px-4 py-6 text-center"
      style={{
        backgroundColor: colors.panel,
        border: `1px dashed ${colors.saffron}`,
        borderRadius: "3px",
      }}
    >
      <p
        className="font-heading font-semibold"
        style={{ color: colors.ink, fontSize: "14px" }}
      >
        {missingCount > 0
          ? `${missingCount} documents still required`
          : "All required documents uploaded"}
      </p>
      <p
        className="font-body"
        style={{ color: colors.textDim, fontSize: "12px" }}
      >
        PDF, JPG or PNG up to 10 MB each.
      </p>
      <Button variant="accent" size="md">
        Upload Document
      </Button>
    </div>
  );
}
