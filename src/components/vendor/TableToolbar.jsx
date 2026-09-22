import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

// Search box on the left, optional primary action on the right.
// Shared by the Products, Orders, Inventory, RFQ and Documents screens.
export default function TableToolbar({
  query,
  onQueryChange,
  placeholder = "Search...",
  actionLabel,
  onAction,
  inputId = "table-search",
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Input
        id={inputId}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={placeholder}
        adornment={"\u{1F50D}"}
        className="w-full sm:max-w-xs"
        aria-label={placeholder}
      />
      {actionLabel && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
