/** Shared label + 44px input shell for the checkout form, matching the Figma "Form field" spec (node 1:3242 etc.). */
export function CheckoutField({
  label,
  defaultValue,
  placeholder,
}: {
  label: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <label className="text-[12px] font-bold text-ink">{label}</label>
      <input
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-11 w-full rounded-[6px] border border-border bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink/40 focus-visible:border-pink"
      />
    </div>
  );
}

/** Shared label + 44px select shell, same visual spec as CheckoutField but for a fixed option set (country, address type). */
export function CheckoutSelectField({
  label,
  defaultValue,
  options,
}: {
  label: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <label className="text-[12px] font-bold text-ink">{label}</label>
      <div className="relative">
        <select
          defaultValue={defaultValue}
          className="h-11 w-full appearance-none rounded-[6px] border border-border bg-white px-3 text-[13px] text-ink outline-none focus-visible:border-pink"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/50">⌄</span>
      </div>
    </div>
  );
}
