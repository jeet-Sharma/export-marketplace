'use client';

import NavIcon from '@/components/buyer/NavIcon';

const BUTTON_CLASSES =
  'flex h-8 w-8 items-center justify-center border-line text-textdim transition-colors hover:bg-paper hover:text-text disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Quantity control with a labelled number input between two step buttons.
 *
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.label Accessible label, visually hidden.
 * @param {number} props.value
 * @param {number} props.step
 * @param {(value: number) => void} props.onChange
 * @param {number} [props.min]
 * @returns {import('react').ReactElement}
 */
export default function QuantityStepper({ id, label, value, step, onChange, min = 1 }) {
  const clamp = (next) => Math.max(min, next);

  return (
    <div className="inline-flex items-stretch rounded-sharp border border-line bg-panel">
      <button
        type="button"
        className={`${BUTTON_CLASSES} border-r`}
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        title={`Decrease by ${step}`}
      >
        <NavIcon name="minus" size={14} title={`Decrease by ${step}`} />
      </button>

      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(clamp(Number(event.target.value) || min))}
        className="w-16 bg-panel text-center font-heading text-sm tabular-nums text-text"
      />

      <button
        type="button"
        className={`${BUTTON_CLASSES} border-l`}
        onClick={() => onChange(value + step)}
        title={`Increase by ${step}`}
      >
        <NavIcon name="plus" size={14} title={`Increase by ${step}`} />
      </button>
    </div>
  );
}
