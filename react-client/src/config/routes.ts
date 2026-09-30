// Central route path constants for the public site. Mirrors the pattern in
// config/navigation.ts (vendor sidebar hrefs) so route strings live in one
// place instead of being repeated as literals across components — if a
// route folder under src/app moves, this is the only file that changes.
export const routes = {
  home: "/",
  login: "/login",
  signup: "/signup",
  sellWithUs: "/sell-with-us",
  vendorDashboard: "/vendor/dashboard",
  verifyEmail: "/verify-email",
} as const;
