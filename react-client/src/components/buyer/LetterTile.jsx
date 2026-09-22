import { accentClasses, accentForKey } from '@/theme/accents';
import cx from '@/lib/cx';

/** @type {Record<'sm' | 'md' | 'lg', string>} */
const SIZE_CLASSES = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-base',
};

/**
 * Initial tile standing in for product and company imagery.
 *
 * @param {object} props
 * @param {string} props.label Source of the initials, e.g. a product name.
 * @param {'sm' | 'md' | 'lg'} [props.size]
 * @param {import('@/theme/colors').AccentToken} [props.accent] Defaults to a
 *   colour derived from `label`, so the same entity keeps the same tile.
 * @param {number} [props.letters]
 * @param {string} [props.initials] Overrides the initials derived from `label`.
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function LetterTile({
  label,
  size = 'md',
  accent,
  letters = 2,
  initials,
  className,
}) {
  const derivedInitials =
    initials ??
    label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, letters)
      .map((word) => word[0])
      .join('')
      .toUpperCase();

  return (
    <span
      aria-hidden
      className={cx(
        'flex shrink-0 items-center justify-center rounded-sharp font-heading font-semibold',
        SIZE_CLASSES[size],
        accentClasses[accent ?? accentForKey(label)].soft,
        className,
      )}
    >
      {derivedInitials}
    </span>
  );
}
