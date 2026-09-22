import Link from 'next/link';
import cx from '@/lib/cx';

/**
 * @typedef {'primary' | 'accent' | 'teal' | 'danger' | 'ghost' | 'subtle'} ButtonVariant
 * @typedef {'sm' | 'md'} ButtonSize
 */

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-1.5 rounded-sharp border font-medium tracking-tight transition-colors disabled:cursor-not-allowed disabled:opacity-50';

/** @type {Record<ButtonVariant, string>} */
const VARIANT_CLASSES = {
  primary: 'border-ink bg-ink text-paper hover:bg-text',
  accent: 'border-saffron bg-saffron text-panel hover:border-ink hover:bg-ink',
  teal: 'border-teal bg-teal text-panel hover:border-ink hover:bg-ink',
  danger: 'border-coral bg-coral text-panel hover:border-ink hover:bg-ink',
  ghost: 'border-line bg-panel text-text hover:bg-paper',
  subtle: 'border-line bg-paper text-textdim hover:bg-panel hover:text-text',
};

/** @type {Record<ButtonSize, string>} */
const SIZE_CLASSES = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-9 px-4 text-sm',
};

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {ButtonVariant} [props.variant]
 * @param {ButtonSize} [props.size]
 * @param {'button' | 'submit'} [props.type] Ignored when `href` is set.
 * @param {string} [props.href] Renders a link instead of a button.
 * @param {() => void} [props.onClick]
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.fullWidth]
 * @param {string} [props.title]
 * @param {boolean} [props.pressed] Sets aria-pressed for toggle buttons.
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function Button({
  children,
  variant = 'ghost',
  size = 'sm',
  type = 'button',
  href,
  onClick,
  disabled = false,
  fullWidth = false,
  title,
  pressed,
  className,
}) {
  const classes = cx(
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    fullWidth && 'w-full',
    className,
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes} title={title}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={pressed}
    >
      {children}
    </button>
  );
}
