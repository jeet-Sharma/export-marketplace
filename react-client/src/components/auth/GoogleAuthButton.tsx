import Button from "@/components/ui/Button";

export interface GoogleAuthButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

// Multi-color "G" mark, kept as an inline SVG (same "no icon-library
// dependency" approach as components/vendor/NavIcon.tsx) — it can't reuse
// NavIcon's currentColor stroke set since Google's mark is specifically
// four brand colors, not a themeable single-color glyph.
function GoogleMark() {
  return (
    <svg width={16} height={16} viewBox="0 0 48 48" aria-hidden="true" className="shrink-0">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18a13.42 13.42 0 0 1 0-8.36v-5.7H4.34a22.94 22.94 0 0 0 0 19.76z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

// "Continue with Google" action. No OAuth flow is wired up yet — there is
// no auth API in this project (see lib/auth.ts) — so onClick is optional
// and the button disables itself when the caller hasn't supplied one, the
// same convention used for other not-yet-wired actions (see OrderRow).
export default function GoogleAuthButton({ onClick, disabled }: GoogleAuthButtonProps) {
  return (
    <Button
      variant="ghost"
      size="md"
      type="button"
      className="w-full gap-2"
      onClick={onClick}
      disabled={disabled ?? !onClick}
    >
      <GoogleMark />
      Continue with Google
    </Button>
  );
}
