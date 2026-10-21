import { useId } from "react";
import type { ReactNode } from "react";

/** Shared label + 40px input shell, matching every field in the Figma "Add product" modal (node 1:4180).
 *
 * `htmlFor` is required so the rendered `<label>` is explicitly associated with
 * its control — screen readers can reliably announce the field name, and clicking
 * the label focuses the input/select. Callers (TextField, SelectField) generate a
 * stable id via `useId()` and pass it here. */
export function FieldShell({
  label,
  htmlFor,
  children,
}: {
  label: string;
  /** Must match the `id` on the child control. */
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[11px] font-bold text-bloom-ink">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputBaseClasses =
  "h-10 w-full rounded-[10px] border border-bloom-border bg-white px-3 text-[13px] text-bloom-ink outline-none placeholder:text-[#a6a2a4] focus-visible:border-bloom-pink";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Trailing unit label (e.g. "kg", "days", "months") shown inside the field, matching the Figma unit suffix pattern. */
  suffix?: string;
  type?: "text" | "number";
}) {
  const id = useId();
  return (
    <FieldShell label={label} htmlFor={id}>
      <div className={`flex items-center ${inputBaseClasses}`}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#a6a2a4]"
        />
        {suffix ? (
          <span className="shrink-0 pl-2 text-bloom-muted">{suffix}</span>
        ) : null}
      </div>
    </FieldShell>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <FieldShell label={label} htmlFor={id}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputBaseClasses} appearance-none ${
            value ? "" : "text-[#a6a2a4]"
          }`}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="text-bloom-ink">
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-3 top-1/2 size-[11px] -translate-y-1/2 text-bloom-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </FieldShell>
  );
}
