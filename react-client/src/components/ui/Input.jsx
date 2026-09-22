import cx from '@/lib/cx';

export const FIELD_CLASSES =
  'w-full rounded-sharp border border-line bg-panel px-2.5 text-sm text-text placeholder:text-textdim focus:border-saffron';

export const FIELD_LABEL_CLASSES = 'block text-[11px] font-medium uppercase tracking-wide text-textdim';

/**
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.label Always provided; hide it visually with `labelHidden`.
 * @param {string | number} props.value
 * @param {(value: string) => void} props.onChange
 * @param {'text' | 'number' | 'email' | 'search'} [props.type]
 * @param {string} [props.placeholder]
 * @param {boolean} [props.labelHidden]
 * @param {boolean} [props.required]
 * @param {string} [props.hint]
 * @param {string} [props.error]
 * @param {number} [props.min]
 * @param {string} [props.step]
 * @param {import('react').ReactNode} [props.prefix] Static adornment, e.g. a currency symbol.
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function Input({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  labelHidden = false,
  required = false,
  hint,
  error,
  min,
  step,
  prefix,
  className,
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cx('space-y-1', className)}>
      <label htmlFor={id} className={cx(FIELD_LABEL_CLASSES, labelHidden && 'sr-only')}>
        {label}
      </label>

      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-xs text-textdim">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          required={required}
          min={min}
          step={step}
          placeholder={placeholder}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={cx(FIELD_CLASSES, 'h-8', prefix && 'pl-7', error && 'border-coral')}
        />
      </div>

      {error ? (
        <p id={`${id}-error`} className="text-[11px] text-coral">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-[11px] text-textdim">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
