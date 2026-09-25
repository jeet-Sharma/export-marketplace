---
inclusion: always
---

# Export Marketplace — Development Rulebook (Index)

This is a monorepo with two independently deployed, independently CI'd apps.
This file holds the rules that apply everywhere. App-specific and
concern-specific rules live in sibling steering files, loaded automatically
alongside this one:

- `frontend-rules.md` — react-client (Next.js) conventions
- `backend-rules.md` — nest-server (NestJS) conventions
- `api-rules.md` — REST API conventions for nest-server
- `security-rules.md` — auth, secrets, input/output handling (both apps)
- `testing-rules.md` — what to test and how, scoped to what's actually testable today
- `marketplace-domain.md` — business domain boundaries, the planned data model, and money/database conventions once a database exists

```
export-marketplace/
├── react-client/   # Next.js frontend (public site + vendor portal)
└── nest-server/    # NestJS backend API
```

Both apps are early-stage. Confirmed absent as of this writing — do not
assume any of the following exist unless you've just added them yourself:
**no database/ORM, no authentication/authorization, no state management
library, no form/validation library, no class-validator, no frontend
tests.** Rules below are written for what's actually here, not for a
hypothetical mature version of this stack.

## General engineering rules (both apps)

1. **No `any`.** `react-client/eslint.config.mjs` and
   `nest-server/oxlint.json` both enforce `@typescript-eslint/no-explicit-any`
   as an error. Use `unknown` + narrowing, a proper interface/type, or a
   generic instead. Don't work around this with `@ts-ignore` — if a type
   error is genuinely a false positive, the comment above `@ts-ignore` (or
   `@ts-expect-error`) must explain why, and this should be rare.
2. **Strict TypeScript in both `tsconfig.json`s.** Don't loosen `strict` to
   make a change compile. Fix the underlying type. `nest-server` sets
   `strictPropertyInitialization: false` deliberately (needed for Nest DI
   patterns) — that's the one intentional exception, not a precedent for
   others.
3. **Verify before calling it done** — see `testing-rules.md` for exactly
   which commands, scoped to what changed. Never state a command passed
   without having actually run it and seen the result.
4. **Lockfiles must be committed in sync with `package.json`.** CI runs
   `npm ci` in both jobs, which fails hard on drift. After any
   `npm install`, commit the updated lockfile in the same change.
5. **Lockfiles are platform-sensitive.** CI runs on `ubuntu-latest`; local
   dev may be on Windows or macOS. Optional/native dependencies (WASM
   fallbacks, prebuilt binaries) can resolve differently by OS. If `npm ci`
   fails in CI right after a dependency change but passes locally on a
   non-Linux machine, regenerate the lockfile inside a Linux environment
   (Docker `node:24-slim` or WSL) rather than trusting a Windows/macOS
   regeneration.
6. **Pin new dependencies with the same style already used in that
   package.json** (this repo uses caret ranges, e.g. `^3.1138.0`,
   `^12.0.1`). Flag unusual/unfamiliar package names before installing.
7. **Don't add a dependency for something already solved.** Both apps are
   dependency-light by evidence (5 UI primitives cover the whole design
   system in react-client; nest-server has no ORM, no validation library,
   no auth library yet) — check what's installed first, and check
   `marketplace-domain.md` / task context for whether a "missing" library
   is actually planned-but-not-yet-added versus genuinely needed now.
8. **Environment variables**: read via each app's established mechanism
   (see `backend-rules.md` for nest-server's `ConfigService` convention).
   Never commit `.env` — both apps gitignore it and ship `.env.example`
   instead.
9. **Comments explain *why*, not *what*.** The existing codebase's comments
   (e.g. `storage.service.ts`'s explanation of why `available` degrades
   instead of throwing, `products.ts`'s explanation of why lookups go
   through a function instead of the raw object) are the model to follow —
   they explain a design decision a reader wouldn't otherwise infer, not
   the mechanics of the next line.
10. **Small, focused functions/services**, one clear responsibility each.
    This is already the pattern in both apps (thin controllers, `Panel`/
    `Button`/etc. as single-purpose primitives) — don't introduce a
    "god service" or "god component" that breaks it.

## Change-scope discipline

1. Understand the requested scope before touching files.
2. Inspect the relevant existing code and match its established pattern —
   don't invent a parallel convention when one already exists (see
   `frontend-rules.md`/`backend-rules.md` for the specific patterns to
   match).
3. Make the smallest coherent change that satisfies the task.
4. Don't refactor, rename, or restyle unrelated code as a side effect.
5. Don't modify working vendor portal code for a public-site task, or vice
   versa, unless the task explicitly requires a change that spans both —
   see `frontend-rules.md`'s "areas" section.
6. Preserve backward compatibility of existing routes/exports/props where
   reasonable; call out any breaking change explicitly.
7. If a cross-module change is genuinely required, explain why before
   making it, not after.

## When requirements are unclear

Do not invent business rules to fill a gap. If ambiguity could materially
affect the data model, an API contract, security/authorization, payment
behavior, compliance, workflow state, buyer/vendor ownership boundaries,
Trade Assurance, or any destructive/irreversible operation, ask before
deciding — see `marketplace-domain.md` for the domain concepts most likely
to be ambiguous. For minor implementation details (naming, exact wording,
which of two equivalent approaches), follow the closest existing repository
convention and proceed.

## Keeping this rulebook accurate

This rulebook is only useful if it matches the repository. When you add a
library, introduce a new architectural pattern, or establish a new
convention, update the relevant steering file in the same change. If you
notice a rule here that no longer matches the code (e.g. a library gets
added that a rule says doesn't exist yet), flag it and propose the
correction rather than silently working around the stale rule.
