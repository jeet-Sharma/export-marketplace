# categoryId URL Param Validation Bugfix Design

## Overview

After a product is created via `AddProductModal`, RTK Query invalidates the `ProductList` tag and refetches `GET /admin/products`. If the URL already contains a `categoryId` search param that is not a valid UUID (e.g. a slug or display name), `useProductQueryParams` forwards it verbatim to the API. The NestJS backend's `@IsUUID()` validator rejects the request with a 400, so the product list never reloads after creation.

The fix is a single-line guard inside the `state` useMemo of `useProductQueryParams.ts`: validate `categoryId` against a UUID v4 regex and resolve to `undefined` when the value does not match, mirroring how `sort` and `status` are already allowlist-sanitised. No other files require changes.

## Glossary

- **Bug_Condition (C)**: The URL contains a `categoryId` search param whose value is not a valid UUID v4 string.
- **Property (P)**: When C holds, `categoryId` in the returned `ProductQueryState` must be `undefined`, so the API call omits the parameter.
- **Preservation**: All other filter/sort/pagination behaviour — and the forwarding of valid UUID `categoryId` values — must remain completely unchanged.
- **useProductQueryParams**: The hook in `react-client/src/features/dashboard/products/useProductQueryParams.ts` that reads URL search params and returns typed query state plus setters.
- **isBugCondition**: Pseudocode predicate that returns `true` when the raw `categoryId` param value fails UUID v4 validation.
- **ProductQueryState**: The typed object returned by the `state` useMemo; consumed by `ProductsWorkspace.tsx` to build the RTK Query argument.

## Bug Details

### Bug Condition

The bug manifests when the URL search params contain a `categoryId` value that is not a valid UUID v4. The `useProductQueryParams` hook reads the raw string with `searchParams.get("categoryId") ?? undefined` and returns it without validation, unlike `sort` and `status` which are validated against allowlists before use.

**Formal Specification:**

```
FUNCTION isBugCondition(searchParams)
  INPUT:  searchParams — URLSearchParams from the current URL
  OUTPUT: boolean

  rawCategoryId := searchParams.get("categoryId")

  IF rawCategoryId IS null THEN
    RETURN false   -- no param present; not a bug condition
  END IF

  UUID_V4_REGEX := /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  RETURN NOT UUID_V4_REGEX.test(rawCategoryId)
         -- non-UUID string would be forwarded verbatim → backend 400
END FUNCTION
```

### Examples

- URL: `?categoryId=electronics` → `isBugCondition` = **true** — slug forwarded verbatim; backend returns 400.
- URL: `?categoryId=3fa85f64-5717-4562-b3fc-2c963f66afa6` → `isBugCondition` = **false** — valid UUID; forwarded correctly.
- URL: `?categoryId=` (empty string) → `isBugCondition` = **true** — `searchParams.get` returns `""`, which fails the regex; should resolve to `undefined`.
- URL: `?categoryId=123` → `isBugCondition` = **true** — short numeric string fails UUID regex; should resolve to `undefined`.
- URL: (no `categoryId` param) → `isBugCondition` = **false** — `get` returns `null`; already resolves to `undefined`.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- Valid UUID `categoryId` values in the URL MUST continue to be forwarded to the API as the active category filter.
- Absence of a `categoryId` param MUST continue to resolve to `undefined` and omit the param from the API call.
- The `setCategoryId` setter MUST continue to write UUIDs to the URL when the user picks a category, and remove the param when cleared.
- All other query params (`sort`, `status`, `search`, `page`, `pageSize`) MUST be completely unaffected by this change.
- The existing `|| undefined` guard in `ProductsWorkspace.tsx` and the `...(categoryId ? { categoryId } : {})` spread in `productsApi.ts` MUST continue to work as the final safety net downstream.

**Scope:**

Any input where `categoryId` is either absent or a valid UUID v4 is NOT a bug condition and must behave identically before and after the fix.

## Hypothesized Root Cause

1. **Missing allowlist/format guard for `categoryId`**: Unlike `sort` (validated against `VALID_SORTS`) and `status` (validated with `=== "PUBLISHED" || === "DRAFT"`), the `categoryId` line has no format check — just a null-coalescing fallback. This is the direct cause.

2. **Trust of URL params at the hook boundary**: The hook assumes the URL only ever contains values written by the app's own setters (which do write valid UUIDs). However, the URL is user-controllable, so arbitrary strings can arrive.

3. **No intermediate sanitisation downstream**: `ProductsWorkspace` uses `state.categoryId || undefined`, which catches empty string but not other non-UUID strings. `productsApi.ts` spreads `categoryId` only when truthy, which also cannot detect format errors. Neither layer compensates for an invalid non-empty string.

4. **Timing with RTK Query invalidation**: The bug becomes visible immediately after product creation because `invalidatesTags` triggers a refetch while the invalid `categoryId` is still in the URL, making the failure prominent and reproducible.

## Correctness Properties

Property 1: Bug Condition - Invalid categoryId Resolves to Undefined

_For any_ URL search params where `isBugCondition` returns true (i.e., `categoryId` is present but not a valid UUID v4), the fixed `useProductQueryParams` hook SHALL return `categoryId: undefined` in its `state`, ensuring the `GET /admin/products` request is sent without a `categoryId` query parameter and the backend does not return a 400 error.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Valid and Absent categoryId Behaviour Unchanged

_For any_ URL search params where `isBugCondition` returns false (i.e., `categoryId` is either absent or a valid UUID v4), the fixed hook SHALL produce exactly the same `state.categoryId` value as the original hook — `undefined` when absent, and the UUID string when present — preserving all existing category filter behaviour.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `react-client/src/features/dashboard/products/useProductQueryParams.ts`

**Function**: `useProductQueryParams` — the `state` useMemo

**Specific Changes**:

1. **Add UUID v4 regex constant** near the top of the file alongside `VALID_SORTS`:
   - `const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;`

2. **Replace the raw `categoryId` read** inside the `state` useMemo:
   - Before: `categoryId: searchParams.get("categoryId") ?? undefined,`
   - After: `categoryId: UUID_V4_RE.test(searchParams.get("categoryId") ?? "") ? (searchParams.get("categoryId") as string) : undefined,`
   - Alternatively (cleaner): extract to a local variable first:
     ```ts
     const rawCategoryId = searchParams.get("categoryId");
     // ...
     categoryId: rawCategoryId && UUID_V4_RE.test(rawCategoryId) ? rawCategoryId : undefined,
     ```

3. **No changes** to `productsApi.ts`, `ProductsWorkspace.tsx`, or any other file — existing downstream guards remain in place as a belt-and-suspenders measure.

## Testing Strategy

### Validation Approach

The testing strategy uses two phases: first run tests against the **unfixed** code to confirm counterexamples surface as expected, then apply the fix and verify both correctness properties hold.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples demonstrating the bug on unfixed code. Confirm the root cause before implementing the fix.

**Test Plan**: Render `useProductQueryParams` (or a minimal harness) with URL search params containing non-UUID `categoryId` values. Assert that the returned `state.categoryId` is `undefined`. On unfixed code these assertions fail — confirming the raw string is forwarded.

**Test Cases**:

1. **Slug input**: Set `?categoryId=electronics` — expect `state.categoryId === undefined` (fails on unfixed code, raw slug returned)
2. **Short numeric string**: Set `?categoryId=123` — expect `state.categoryId === undefined` (fails on unfixed code)
3. **Empty string**: Set `?categoryId=` — expect `state.categoryId === undefined` (may pass on unfixed code due to `?? undefined` converting `null`, but `get("")` returns `""` not `null`; actual behavior depends on browser — worth checking)
4. **Valid UUID (no bug)**: Set `?categoryId=3fa85f64-5717-4562-b3fc-2c963f66afa6` — expect value forwarded (should pass on both unfixed and fixed code)

**Expected Counterexamples**:

- `state.categoryId` returns `"electronics"` instead of `undefined` on unfixed code.
- Slug or arbitrary string gets forwarded to the RTK Query argument and then to the API.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed hook returns `categoryId: undefined`.

**Pseudocode:**

```
FOR ALL searchParams WHERE isBugCondition(searchParams) DO
  state := useProductQueryParams_fixed(searchParams).state
  ASSERT state.categoryId === undefined
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed hook returns the same `state.categoryId` as the original.

**Pseudocode:**

```
FOR ALL searchParams WHERE NOT isBugCondition(searchParams) DO
  ASSERT useProductQueryParams_original(searchParams).state.categoryId
       = useProductQueryParams_fixed(searchParams).state.categoryId
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:

- It generates many UUID v4 and null-param combinations automatically.
- It catches subtle regex edge cases (e.g. uppercase hex digits, braces) that manual tests might miss.
- It provides strong guarantees that no valid UUID is incorrectly rejected.

**Test Cases**:

1. **Valid UUID preservation**: Generate random UUID v4 strings; verify they pass through unchanged after the fix.
2. **Absent param preservation**: No `categoryId` in URL; verify `undefined` is returned both before and after the fix.
3. **Other params unaffected**: Combine invalid `categoryId` with various `sort`, `status`, `search` values; verify only `categoryId` changes.

### Unit Tests

- Test that each non-UUID string variant (`"electronics"`, `"123"`, `""`, `"abc-def"`) resolves to `undefined`.
- Test that a valid UUID v4 string resolves to the same UUID.
- Test that absence of `categoryId` param resolves to `undefined`.
- Test regex boundary: near-UUID strings (wrong segment lengths, extra characters) resolve to `undefined`.

### Property-Based Tests

- Generate random alphanumeric strings that are not valid UUIDs; assert all resolve to `undefined` after the fix.
- Generate valid UUID v4 strings; assert all are forwarded unchanged (Property 2).
- Generate full query-string objects with random combinations of params; assert non-`categoryId` params are unaffected (Property 2 — other params preserved).

### Integration Tests

- Simulate the AddProductModal creation flow: create a product while `?categoryId=electronics` is in the URL; assert the subsequent `GET /admin/products` refetch does not include `categoryId` and succeeds with 200.
- Simulate the same flow with a valid UUID `categoryId`; assert the refetch includes the UUID filter and succeeds.
- Verify category dropdown selection still writes a valid UUID to the URL and applies the filter correctly after the fix.
