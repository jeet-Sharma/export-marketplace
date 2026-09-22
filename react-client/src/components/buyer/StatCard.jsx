import { accentClasses } from '@/theme/accents';
import cx from '@/lib/cx';
import NavIcon from './NavIcon';

/** @type {Record<'up' | 'down' | 'neutral', string>} */
const DELTA_CLASSES = {
  up: 'text-teal',
  down: 'text-coral',
  neutral: 'text-textdim',
};

/**
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.value Already formatted for display.
 * @param {string} [props.deltaLabel]
 * @param {'up' | 'down' | 'neutral'} [props.deltaDirection]
 * @param {import('@/theme/colors').AccentToken} [props.valueAccent] Tints the
 *   figure when it needs attention, e.g. payment issues.
 * @returns {import('react').ReactElement}
 */
export default function StatCard({
  label,
  value,
  deltaLabel,
  deltaDirection = 'neutral',
  valueAccent,
}) {
  return (
    <div className="rounded-sharp border border-line bg-panel p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-textdim">{label}</p>

      <p
        className={cx(
          'mt-2 font-heading text-2xl font-semibold tabular-nums tracking-tight',
          valueAccent ? accentClasses[valueAccent].text : 'text-ink',
        )}
      >
        {value}
      </p>

      {deltaLabel && (
        <p
          className={cx(
            'mt-1 flex items-center gap-1 text-[11px]',
            DELTA_CLASSES[deltaDirection],
          )}
        >
          {deltaDirection === 'up' && <NavIcon name="arrowUp" size={12} />}
          {deltaLabel}
        </p>
      )}
    </div>
  );
}
