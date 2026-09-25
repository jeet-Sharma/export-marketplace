---
inclusion: fileMatch
fileMatchPattern: 'react-client/**'
---

# Frontend Rules — react-client (Next.js)

Confirmed stack (from `package.json`): Next.js 16.3.5, React 19.2.8,
TypeScript ^5, Tailwind CSS v4, ESLint 9 + `eslint-config-next`.
**Confirmed absent: no state management library, no form/validation
library (no react-hook-form/zod/yup), no test runner/test files.** Don't
introduce any of these to solve a small problem — plain `useState`/props
and the existing wizard pattern (see below) have covered every form built
so far.

## Design system — must match on every screen

- Color tokens (`react-client/src/app/globals.css`, mirrored as plain JS in
  `src/theme/colors.ts`): `ink`, `paper`, `panel`, `line`,
  `saffron`/`saffron-soft`, `teal`/`teal-soft`, `coral`/`coral-soft`,
  `blue-grey`/`blue-grey-soft`, `text`/`text-dim`. Never hardcode a hex
  color in a component — use these Tailwind utility classes
  (`bg-saffron`, `text-text-dim`, etc.).
- `theme/colors.ts` also exports `statusTokens`, which maps status keys
  (order/product/inventory/RFQ/document statuses) to a `Badge` tone +
  label. Reuse `statusTokens` for any new status display — don't invent a
  new ad-hoc tone mapping.
- Sharp corners: `--radius: 3px`, used via `rounded`. Don't introduce
  larger/pill radii except where `Badge` intentionally uses them.
- Fonts: `font-heading` (Space Grotesk, headings only) and `font-body` (IBM
  Plex Sans, everything else). Don't add another font.
- **Reuse the 5 existing primitives in `src/components/ui/`
  (`Button`, `Badge`, `Input`, `Panel`, `Table`) instead of writing new
  styled elements.** `Button` variants: `primary | accent | ghost | danger`
  (typed via `ButtonVariant` in `src/types/ui.ts`); sizes `sm | md`.
  `Badge` tones: `neutral | saffron | teal | blueGrey | coral`. If a screen
  needs a visual pattern none of these five cover, extend the primitive
  (add a variant/prop) rather than building a parallel one-off component.

## Three distinct areas — keep them separate

- **Public site**: `src/app/page.tsx`, `src/app/products/[productId]/`,
  `src/app/sell-with-us/`, and their components under
  `src/components/public/` (shares `PublicHeader`/`PublicFooter`).
- **Vendor portal**: `src/app/vendor/**` and `src/components/vendor/**`.
  Has its own shell (`VendorLayout`/`Sidebar`/`PageHeader`) and its own nav
  config (`src/config/navigation.ts`).
- **Sell-with-us wizard**: `src/components/sellWithUs/**`, a public
  multi-step vendor-signup form. It is public-facing (reachable without
  login) but produces vendor onboarding data — don't merge its state/types
  into either the public marketplace data or the vendor portal's internal
  seed data; it has its own `src/types/sell-with-us.ts` and
  `src/data/sellWithUs.ts` for a reason. **It currently has no backend
  wired up** (`SellWithUsWizard.tsx` says so explicitly) — submitting just
  shows a thank-you screen. Don't assume it persists anywhere until that's
  actually built.
- A future buyer portal, if/when it exists, should follow this same
  pattern: its own route segment, its own `components/<area>/` folder, its
  own data/type files. Don't retrofit buyer concerns into `vendor/` or
  `public/`.
- **Never mix seed data across areas.** Public-facing seed data lives in
  `src/data/public.ts`. Vendor-internal seed data (maker-checker workflow
  state, earnings, inventory, etc.) lives in `src/data/products.ts`,
  `profile.ts`, `orders.ts`, `inventory.ts`, `rfq.ts`, `analytics.ts`,
  `documents.ts`. These model different things (public catalog display vs.
  internal workflow state) — don't reuse one for the other.

## Data-access layer pattern

Don't index a hardcoded seed object directly from a page/route component.
Go through a small function in `src/lib/` that returns `T | undefined` —
see `src/lib/products.ts` (`getProductById`, `getAllProductIds`) as the
canonical example, including its type (`Product` and friends, defined
explicitly rather than inferred from the seed literal). This keeps the
page component agnostic to whether the data is a hardcoded object today or
a real API/database call later — swapping the implementation inside the
`lib/` function shouldn't require touching any caller.

Follow the same pattern for route path constants: central route strings
live in `src/config/routes.ts` (mirroring `src/config/navigation.ts`'s
vendor sidebar hrefs) rather than being repeated as literals across
components.

## JSX / unicode escapes — a real bug that's happened here, avoid repeating it

`\uXXXX` and `\u{XXXXX}` escape sequences are only interpreted inside a
real JS string — i.e. inside `{...}` or a template literal. They are
**not** interpreted as bare JSX text or as a plain (non-expression) JSX
attribute value; React renders the literal backslash-u text instead.

```tsx
// WRONG — renders the literal text "\u00B7", not a middle dot
<p>{supplier.country} \u00B7 {supplier.categories}</p>
<Input adornment="\u{1F50D}" />

// RIGHT — wrapped in a JS expression so the escape is actually interpreted
<p>{supplier.country} {"\u00B7"} {supplier.categories}</p>
<Input adornment={"\u{1F50D}"} />
```

When in doubt, paste the actual unicode character into the source instead
of an escape sequence — unambiguous either way.

## Next.js specifics

- App Router only (`src/app/`). Server Components by default; add
  `"use client"` only where interactivity requires it (the codebase's
  actual usage: forms with `useState`, event handlers — see
  `SellWithUsWizard.tsx`, `CountryLogistics.tsx`, `RfqForm.tsx`, `Sidebar.tsx`).
- Pages/route files are `.tsx`; shared data/config/type files are `.ts`.
  Domain types live under `src/types/` as one file per domain concept,
  re-exported through the barrel `src/types/index.ts` — add new domain
  types there rather than defining ad-hoc inline types in a component file
  when the type will be reused.
- Path alias `@/*` maps to `./src/*` (from `tsconfig.json`) — use it for
  all cross-folder imports rather than relative `../../..` paths.
- Ignore the auto-generated `AGENTS.md`/`CLAUDE.md` "breaking changes"
  banner in this app — it's regenerated by `next dev` itself
  (`node_modules/next/dist/server/lib/generate-agent-files.js`), not a real
  project rule.

## Forms, loading/error/empty states

No form library is installed — forms are built with plain `useState` and
per-step validator functions returning an error map (see
`SellWithUsWizard.tsx`'s `STEP_VALIDATORS` + `Step*.tsx` files' exported
`validate*` functions). Follow this pattern for new forms rather than
introducing a new validation approach or library.

There is no established loading/error/empty-state pattern yet because
there is no live data fetching in the app (all current data is
hardcoded/seeded). When wiring up real data fetching for the first time,
propose a pattern and confirm it before applying it broadly — don't invent
one silently and spread it across multiple components in the same change.

## Accessibility and images

Existing components use semantic elements and `aria-label`/`aria-hidden`
where appropriate (e.g. `PublicHeader`'s `aria-label="Primary"` nav,
decorative emoji spans marked `aria-hidden`) — keep doing this for new
interactive elements and icon-only buttons.
