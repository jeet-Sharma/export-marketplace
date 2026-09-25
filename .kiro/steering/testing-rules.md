---
inclusion: always
---

# Testing and Verification Rules

## Current test coverage — be accurate about this

- `nest-server`: Vitest. Two specs exist — `src/app.controller.spec.ts`
  (unit) and `test/app.e2e-spec.ts` (e2e, boots full `AppModule` +
  `supertest` against `GET /`). **No tests exist for `storage` or
  `messaging`.** `npm test` (unit), `npm run test:e2e`, `npm run test:cov`.
- `react-client`: **no test runner, no test files exist.** There is no
  `test`/`test:*` script in `package.json`. Don't reference running
  frontend tests as a verification step until a test runner is actually
  added — and don't silently add one as a side effect of an unrelated
  task.

## Verification commands, scoped to what changed

For a `react-client` change:
```
npx tsc --noEmit   # or the build, which type-checks too
npm run lint
npm run build      # for anything beyond a trivial content/style change
```

For a `nest-server` change:
```
npm run lint
npm run build       # type-checks (tsc) via nest build
npm test            # if the change touches src/ business logic
npm run test:e2e    # if the change touches routing, module wiring, or app bootstrap
```

This mirrors `.github/workflows/ci.yml` exactly (both the root copy and
`react-client/.github/workflows/ci.yml` run: API → `npm ci && npm run lint
&& npm test && npm run test:e2e && npm run build`; Client → `npm ci &&
npm run lint && npm run build`). Matching CI locally before calling
something done is the whole point — CI has no `.env` file and runs on
`ubuntu-latest`, so a change that only works with a local `.env` or only
passes on Windows isn't actually verified.

## Never claim a command passed without running it

State plainly what was and wasn't executed. If a required check can't be
run in the current environment (e.g. no Docker available to test
LocalStack-dependent behavior, no internet access blocking a Next.js font
fetch during build), say so explicitly rather than asserting success.

## When adding backend modules/endpoints

`storage` and `messaging` currently have zero test coverage despite being
real, working modules — this is an existing gap, not a pattern to
replicate. When you touch either module, or add a new one, add focused
unit tests for the service (mocking the injected AWS client) and,
where the change affects routing/wiring, an e2e test following
`app.e2e-spec.ts`'s `Test.createTestingModule` pattern.

## Bug fixes

When fixing a bug, add or update a test that would have caught the
regression, when a test target exists for that app (currently: only
`nest-server`, since `react-client` has no test runner). Don't modify an
existing test's expectations merely to make a broken implementation pass —
fix the implementation, or if the test's expectation was actually wrong,
say so explicitly and explain why before changing it.

## Full CI-equivalent suite

For any change that touches both apps, spans a module boundary, or is
being prepared for merge/release, run the full set of commands above for
*both* apps, not just the one that looks most directly affected —
cross-app assumptions (a shared type shape, a route the frontend calls)
are exactly what a partial check misses.
