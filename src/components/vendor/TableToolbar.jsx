import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// Search box on the left, optional primary action on the right.
// Shared by the Products, Orders, Inventory, RFQ and Documents screens.
// `label` gives the search input a real visible <label> (not just an
// aria-label) so sighted keyboard users get a persistent cue, not just the
// placeholder text that disappears once they start typing.
export default function TableToolbar({
  query,
  onQueryChange,
  placeholder = "Search...",
  label = "Search",
  actionLabel,
  onAction,
  inputId = "table-search",
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <Input
        id={inputId}
        label={label}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        adornment={"\u{1F50D}"}
        className="w-full sm:max-w-xs"
      />
      {actionLabel && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
