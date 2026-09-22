import cx from '@/lib/cx';
import { FIELD_CLASSES, FIELD_LABEL_CLASSES } from './Input';

/**
 * @typedef {object} SelectOption
 * @property {string} value
 * @property {string} label
 */

/**
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.label
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {SelectOption[]} props.options
 * @param {boolean} [props.labelHidden]
 * @param {boolean} [props.required]
 * @param {string} [props.hint]
 * @param {string} [props.error]
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function Select({
  id,
  label,
  value,
  onChange,
  options,
  labelHidden = false,
  required = false,
  hint,
  error,
  className,
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cx('space-y-1', className)}>
      <label htmlFor={id} className={cx(FIELD_LABEL_CLASSES, labelHidden && 'sr-only')}>
        {label}
      </label>

      <select
        id={id}
        value={value}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cx(FIELD_CLASSES, 'h-8 appearance-none pr-7', error && 'border-coral')}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

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
