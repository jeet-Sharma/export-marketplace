import cx from '@/lib/cx';
import { FIELD_CLASSES, FIELD_LABEL_CLASSES } from './Input';

/**
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.label
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 * @param {string} [props.placeholder]
 * @param {number} [props.rows]
 * @param {boolean} [props.required]
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function Textarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false,
  className,
}) {
  return (
    <div className={cx('space-y-1', className)}>
      <label htmlFor={id} className={FIELD_LABEL_CLASSES}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={cx(FIELD_CLASSES, 'py-2 leading-5')}
      />
    </div>
  );
}
