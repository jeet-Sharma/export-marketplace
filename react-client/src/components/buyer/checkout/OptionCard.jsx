import cx from '@/lib/cx';

/**
 * Selectable card backed by a real radio input, so the group is keyboard and
 * screen-reader navigable. Used for addresses, shipping modes and payment
 * methods.
 *
 * @param {object} props
 * @param {string} props.name Radio group name.
 * @param {string} props.value
 * @param {boolean} props.checked
 * @param {(value: string) => void} props.onSelect
 * @param {string} props.title
 * @param {import('react').ReactNode} [props.description]
 * @param {import('react').ReactNode} [props.meta] Right-aligned detail, e.g. a price.
 * @returns {import('react').ReactElement}
 */
export default function OptionCard({
  name,
  value,
  checked,
  onSelect,
  title,
  description,
  meta,
}) {
  return (
    <label
      className={cx(
        'flex cursor-pointer items-start gap-3 rounded-sharp border p-3 transition-colors',
        checked ? 'border-saffron bg-saffron-soft' : 'border-line bg-panel hover:bg-paper',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className="mt-1 h-3.5 w-3.5 accent-saffron"
      />

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-text">{title}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-textdim">{description}</span>
        )}
      </span>

      {meta && (
        <span className="shrink-0 font-heading text-sm tabular-nums text-text">{meta}</span>
      )}
    </label>
  );
}
