import { useId, type InputHTMLAttributes, type ReactNode } from "react";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Accepts a ReactNode (not just plain text) so callers can append e.g. a trailing result count. */
  label: ReactNode;
  /** Supporting text shown under the control when there's no validation message. */
  helperText?: string;
  /** Error message — shown in red and sets aria-invalid. Takes priority over successText. */
  errorText?: string;
  /** Success message — shown in green. Ignored when errorText is set. */
  successText?: string;
  /** Visually matches the Figma "Read-Only" state: selectable, but not editable. */
  readOnly?: boolean;
}

/**
 * Shared Checkbox primitive, matching the Figma "Input/Checkbox" design system
 * spec (node 34:23631): unchecked/checked/hover/focus/error/success/disabled/
 * read-only, 20px square control with 4px radius inside a 46px-tall row.
 *
 * Built on a real native <input type="checkbox"> (just visually hidden) rather
 * than a custom clickable <div>, so keyboard navigation, space-to-toggle, and
 * screen readers all work for free — the Figma states (hover/focus/checked)
 * are driven by CSS peer-* selectors reacting to that real input's state.
 */
export function Checkbox({
  label,
  helperText,
  errorText,
  successText,
  disabled,
  readOnly,
  className = "",
  id,
  ...rest
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hasError = Boolean(errorText);
  const hasSuccess = !hasError && Boolean(successText);

  const boxStateClasses = hasError
    ? "border-error"
    : hasSuccess
      ? "border-success"
      : "border-text-secondary peer-hover:border-text-secondary peer-focus-visible:border-maroon peer-focus-visible:ring-2 peer-focus-visible:ring-maroon";

  return (
    <div className={`flex flex-col gap-[6px] ${className}`}>
      <label
        htmlFor={inputId}
        className={`flex min-h-[28px] items-center gap-[9px] rounded-[10px] px-2 ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${readOnly ? "cursor-default" : ""}`}
      >
        {/* Wrapper is the shared positioning context: the input is `peer`, and
            both the box and the checkmark are its direct siblings, so
            `peer-checked:`/`peer-focus-visible:` apply to each correctly —
            no nested-selector workaround needed. */}
        <span className="relative flex size-5 shrink-0 items-center justify-center">
          <input
            id={inputId}
            type="checkbox"
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={hasError || undefined}
            className="peer sr-only"
            {...rest}
          />
          <span
            aria-hidden
            className={`absolute inset-0 rounded-[4px] border bg-white transition-colors peer-checked:border-pink peer-checked:bg-pink ${boxStateClasses}`}
          />
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="relative hidden size-3.5 text-white peer-checked:block"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 8.5 6.5 12 13 4.5" />
          </svg>
        </span>
        <span className="flex-1 text-[12px] text-ink">{label}</span>
      </label>

      {hasError ? (
        <p className="text-[11px] text-error">{errorText}</p>
      ) : hasSuccess ? (
        <p className="text-[11px] text-success">{successText}</p>
      ) : helperText ? (
        <p className="text-[11px] text-text-secondary">{helperText}</p>
      ) : null}
    </div>
  );
}
