import { accentClasses } from '@/theme/accents';
import cx from '@/lib/cx';

/**
 * @typedef {import('@/theme/colors').AccentToken} AccentToken
 */

const BASE_CLASSES =
  'inline-flex items-center gap-1 rounded-sharp border px-2 py-0.5 text-[11px] font-medium leading-5 whitespace-nowrap';

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {AccentToken} [props.accent]
 * @param {'soft' | 'outline' | 'solid'} [props.variant]
 * @param {import('react').ReactNode} [props.icon]
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function Badge({
  children,
  accent = 'blueGrey',
  variant = 'soft',
  icon,
  className,
}) {
  const palette = accentClasses[accent];
  const variantClasses = {
    soft: cx(palette.soft, 'border-transparent'),
    outline: cx('bg-panel', palette.text, palette.border),
    solid: cx(palette.solid, 'border-transparent'),
  }[variant];

  return (
    <span className={cx(BASE_CLASSES, variantClasses, className)}>
      {icon}
      {children}
    </span>
  );
}
