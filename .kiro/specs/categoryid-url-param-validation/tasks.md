# Implementation Plan

## Overview

Fix the missing UUID v4 validation on the `categoryId` URL search param in `useProductQueryParams.ts`. The bug causes `GET /admin/products` to return a 400 error when a non-UUID value is present in the URL, most visibly after product creation when RTK Query refetches the product list.

The workflow follows the exploratory bugfix methodology: write tests against unfixed code first to confirm the bug exists, then apply the single-line fix, then verify all properties hold.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2"] },
    { "wave": 2, "tasks": ["3"] },
    { "wave": 3, "tasks": ["4"] }
  ]
}
```

## Tasks

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Invalid categoryId Resolves to Undefined
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples demonstrating that non-UUID `categoryId` values are forwarded verbatim by the unfixed hook
  - **Scoped PBT Approach**: Scope the property to concrete failing cases — slug strings and short numeric strings — for reproducibility
  - Create a unit test file at `react-client/src/features/dashboard/products/useProductQueryParams.spec.ts`
  - Render `useProductQueryParams` with URLSearchParams containing non-UUID `categoryId` values (e.g. `"electronics"`, `"123"`, `""`, `"abc-def"`)
  - Assert that `state.categoryId === undefined` for each non-UUID input (from Bug Condition in design: `isBugCondition` returns true when UUID_V4_REGEX does not match)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS — confirms raw slug/string is returned instead of `undefined` (e.g. `state.categoryId` returns `"electronics"` instead of `undefined`)
  - Document counterexamples found (e.g. `"categoryId=electronics"` returns `"electronics"`, proving verbatim forwarding)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Valid and Absent categoryId Behaviour Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `useProductQueryParams` with `?categoryId=3fa85f64-5717-4562-b3fc-2c963f66afa6` returns that UUID unchanged on unfixed code
  - Observe: `useProductQueryParams` with no `categoryId` param returns `undefined` on unfixed code
  - Write property-based tests (using fast-check or equivalent) that, for all valid UUID v4 strings as `categoryId`, the hook returns the UUID unchanged
  - Write property-based tests that, for absent `categoryId`, the hook returns `undefined`
  - Write tests that, for any invalid `categoryId` combined with other params (`sort`, `status`, `search`, `page`), those other params are returned correctly (from Preservation Requirements in design)
  - Verify all preservation tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS — confirms baseline behavior to preserve
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Fix categoryId UUID validation in useProductQueryParams

  - [ ] 3.1 Implement the fix
    - Add `const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;` near the existing `VALID_SORTS` constant at the top of `useProductQueryParams.ts`
    - Inside the `state` useMemo, extract the raw value: `const rawCategoryId = searchParams.get("categoryId");`
    - Replace `categoryId: searchParams.get("categoryId") ?? undefined,` with `categoryId: rawCategoryId && UUID_V4_RE.test(rawCategoryId) ? rawCategoryId : undefined,`
    - No changes needed to `productsApi.ts`, `ProductsWorkspace.tsx`, or any other file
    - _Bug_Condition: isBugCondition(searchParams) where searchParams.get("categoryId") is non-null and fails UUID_V4_RE.test()_
    - _Expected_Behavior: state.categoryId === undefined for all inputs satisfying isBugCondition_
    - _Preservation: valid UUID and absent categoryId behavior unchanged; all other params (sort, status, search, page) unaffected_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Invalid categoryId Resolves to Undefined
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (non-UUID inputs → `undefined`)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES — confirms that non-UUID slugs, numeric strings, and empty strings all resolve to `undefined` after the fix
    - _Requirements: 2.1, 2.2_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Valid and Absent categoryId Behaviour Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS — valid UUIDs still forwarded, absent param still `undefined`, other params unaffected (no regressions)
    - Confirm all tests still pass after fix

- [ ] 4. Checkpoint - Ensure all tests pass
  - Run the full test suite for the products feature: `cd react-client && npx vitest --run src/features/dashboard/products/`
  - Ensure all tests pass, ask the user if questions arise

## Notes

- All changes are confined to `react-client/src/features/dashboard/products/useProductQueryParams.ts` — no other files need to be modified.
- The UUID v4 regex constant `UUID_V4_RE` should be placed alongside the existing `VALID_SORTS` constant for consistency with the hook's validation pattern.
- Use `rawCategoryId && UUID_V4_RE.test(rawCategoryId)` rather than `UUID_V4_RE.test(rawCategoryId ?? "")` to avoid unnecessary regex execution when the param is absent.
- For property-based tests, fast-check's `fc.uuid()` arbitrary generates valid UUID v4 strings; `fc.string()` filtered against the regex generates invalid ones.
- The test file should live at `react-client/src/features/dashboard/products/useProductQueryParams.spec.ts` alongside the source file.
