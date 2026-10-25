// Local Next.js dev server, plus the deployed Vercel web app. Render was
// answering every browser with only localhost, so the live site's fetches
// were rejected. Extra origins can still be added with CORS_ORIGIN
// (comma-separated); they are merged with these, not used instead of them.
const REQUIRED_WEB_ORIGINS = [
  'http://localhost:3000',
  'https://export-marketplace-5vp4.vercel.app',
];

export function resolveCorsOrigins(raw = process.env.CORS_ORIGIN): string[] {
  const configured = (raw ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...REQUIRED_WEB_ORIGINS, ...configured])];
}
