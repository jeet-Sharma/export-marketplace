import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Shows a spinner and disables the button, matching the Figma "Loading" state. */
  loading?: boolean;
  /** Optional leading icon (e.g. a plus/search icon). Hidden while loading. */
  icon?: ReactNode;
  children: ReactNode;
}

/** Inline spinner used for the loading state — a plain CSS-animated ring, no extra asset/icon dependency. */
function Spinner({ variant }: { variant: ButtonVariant }) {
  return (
    <span
      aria-hidden
      className={`size-4 animate-spin rounded-full border-2 border-current border-t-transparent ${
        variant === "primary" ? "text-white" : "text-pink"
      }`}
    />
  );
}

/**
 * Shared Button primitive — Primary (filled pink) and Secondary (outlined pink)
 * variants, matching the Figma "Button states" design system spec (node 14:3):
 * default/hover/pressed/focus/disabled/loading, 40px tall, 10px radius, bold 13px label.
 *
 * Hover/focus/active/disabled are implemented with native CSS states (`hover:`,
 * `focus-visible:`, `active:`, `disabled:`) rather than JS-tracked state, so the
 * component stays a plain, accessible <button> — no extra state management needed
 * for the interaction states a browser already provides for free.
 */
export function Button({
  variant = "primary",
  loading = false,
  icon,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const variantClasses =
    variant === "primary"
      ? "bg-pink text-white hover:bg-pink-hover active:bg-pink-pressed active:shadow-[inset_0px_2px_3px_0px_rgba(87,23,47,0.24)] disabled:bg-pink disabled:opacity-45"
      : "bg-white text-pink border border-pink hover:bg-cream hover:border-pink-hover hover:text-pink-hover active:bg-pink/10 active:border-pink-pressed active:text-pink-pressed disabled:opacity-45";

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-[13px] font-bold transition-[color,background-color,border-color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink focus-visible:ring-offset-2 disabled:cursor-not-allowed motion-safe:active:scale-[0.97] ${variantClasses} ${className}`}
      {...rest}
    >
      {loading ? <Spinner variant={variant} /> : icon}
      {children}
    </button>
  );
}
