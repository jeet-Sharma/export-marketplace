import type { ChangeEvent } from "react";
import { useId } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export interface TableToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  actionLabel?: string;
  onAction?: () => void;
  /**
   * Optional override for the search input's DOM id. When omitted, a
   * unique id is generated per instance via useId() so multiple
   * TableToolbar instances on the same page (or duplicate renders in dev)
   * never collide on the same id — a static default like "table-search"
   * would risk that across the Products, Orders, Inventory, RFQ and
   * Documents screens that all share this component.
   */
  inputId?: string;
}

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
  inputId,
}: TableToolbarProps) {
  const generatedId = useId();
  const resolvedInputId = inputId ?? generatedId;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <Input
        id={resolvedInputId}
        label={label}
        value={query}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onQueryChange(event.target.value)}
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
