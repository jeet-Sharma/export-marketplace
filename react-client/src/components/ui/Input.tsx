import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

/** Input size — "md" matches the compact vendor/wizard forms, "lg" is for
 * standalone forms that need a larger, more prominent field. */
export type InputSize = "md" | "lg";

const WRAPPER_SIZE_CLASSES: Record<InputSize, string> = {
  md: "gap-2 px-[10px] py-[7px]",
  lg: "gap-3 px-4 py-3",
};

const FIELD_SIZE_CLASSES: Record<InputSize, string> = {
  md: "text-[13px]",
  lg: "text-[15px]",
};

const LABEL_SIZE_CLASSES: Record<InputSize, string> = {
  md: "text-[12px]",
  lg: "text-[13px]",
};

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  adornment?: ReactNode;
  label?: string;
  id: string;
  className?: string;
  /** @default "md" */
  inputSize?: InputSize;
}

// Generic text input with an optional leading adornment (used for search).
// forwardRef so form libraries (React Hook Form's `register()`) can attach
// their ref directly to the underlying <input> DOM node.
const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    value,
    onChange,
    placeholder,
    type = "text",
    adornment,
    label,
    id,
    className = "",
    inputSize = "md",
    ...rest
  },
  ref,
) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className={`font-body text-text-dim ${LABEL_SIZE_CLASSES[inputSize]}`}
        >
          {label}
        </label>
      )}
      <div
        className={`flex items-center bg-panel border border-line rounded transition-colors focus-within:border-saffron ${WRAPPER_SIZE_CLASSES[inputSize]}`}
      >
        {adornment && (
          <span className="text-text-dim text-[13px]">{adornment}</span>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`font-body w-full bg-transparent border-none text-text focus:outline-none ${FIELD_SIZE_CLASSES[inputSize]}`}
          {...rest}
        />
      </div>
    </div>
  );
});

export default Input;
