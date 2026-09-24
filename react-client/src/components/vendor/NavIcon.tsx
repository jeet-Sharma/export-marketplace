import type { JSX } from "react";

// Inline stroke icons for the sidebar, keyed by the `icon` field in config/navigation.
// Kept local so the project takes on no icon-library dependency.
export type NavIconName =
  | "dashboard"
  | "products"
  | "orders"
  | "inventory"
  | "rfq"
  | "analytics"
  | "documents"
  | "profile"
  | "bell";

const PATHS: Record<NavIconName, JSX.Element> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M3 9h18" />
    </>
  ),
  products: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  orders: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M3 9h18M8 4v16" />
    </>
  ),
  inventory: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="1" />
      <path d="M3 11h18M12 7v13" />
    </>
  ),
  rfq: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="m3 6 9 7 9-7" />
    </>
  ),
  analytics: (
    <>
      <path d="m12 4 8 15H4z" />
    </>
  ),
  documents: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" stroke="none" />
    </>
  ),
  bell: (
    <>
      <path d="M18 16V11a6 6 0 1 0-12 0v5l-2 3h16z" />
      <path d="M10 22h4" />
    </>
  ),
};

export interface NavIconProps {
  name: NavIconName;
  size?: number;
}

export default function NavIcon({ name, size = 16 }: NavIconProps) {
  const path = PATHS[name];

  if (!path) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {path}
    </svg>
  );
}
