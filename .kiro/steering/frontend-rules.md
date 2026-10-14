---
inclusion: fileMatch
fileMatchPattern: 'react-client/**'
---

# Frontend Rules — react-client (Next.js)

Confirmed stack (from `package.json`): Next.js 16.3.5, React 19.2.8,
TypeScript ^5, Tailwind CSS v4, ESLint 9 + `eslint-config-next`.

**IMPORTANT — status of the state/data libraries below.** The Redux Toolkit /
React Redux / RTK Query / React Hook Form / Zod rules in this file are the
**adopted forward standard**, but **none of these libraries are installed in
`react-client` yet** (dependencies are only `next`, `react`, `react-dom`).
Treat the Redux sections as the required shape for *when* that tooling is
introduced — a deliberate, approved change that also installs the packages and
updates this stack line. Until then:

- Existing screens use plain `useState` + props and server-side data; that is
  valid and should not be rewritten to Redux speculatively.
- Do not add `@reduxjs/toolkit`, `react-redux`, `react-hook-form`, or `zod`
  (or any other global-state/form lib) just to satisfy a small task — install
  them only as part of intentionally standing up the store/API layer.
- The design-system, area-separation, data-access, and JSX rules at the END of
  this file apply RIGHT NOW to all current work.

## 1. STATE MANAGEMENT STANDARD

Use:

- Redux Toolkit
- React Redux
- RTK Query for API/server state
- React Hook Form for form state
- Next.js searchParams for URL/filter state
- useState for small local UI state

Do NOT use legacy Redux patterns.

Do NOT use:

- createStore
- handwritten Redux reducers
- handwritten action constants
- handwritten action creators where createSlice is sufficient
- Redux Saga
- Redux Thunk directly unless there is a specific requirement
- MobX
- Zustand

Do not introduce another global state library without approval.

## 2. DECIDE WHERE STATE BELONGS

Before creating Redux state, classify the state.

### Server State

Examples:

- Products
- Product details
- Vendors
- Categories
- Countries

Use:

RTK Query

Do NOT copy RTK Query response data into Redux slices.

### Global Client State

Examples:

- authenticated user when required globally
- permissions
- globally shared UI state

Use:

Redux Toolkit slice

### Local Component State

Examples:

- modal open/closed
- selected tab
- dropdown open
- temporary toggle

Use:

useState

Do NOT create Redux state for simple local UI behavior.

### Form State

Examples:

- product name
- price
- MOQ
- HS code
- description
- selected vendor

Use:

React Hook Form

Do NOT dispatch Redux actions on every form keystroke.

### URL State

Examples:

- search
- category
- country
- price filter
- MOQ
- sort
- page

Use:

Next.js URL/searchParams.

Example:

/products?category=spices&country=IN&page=2&sort=price_asc

Do NOT duplicate URL filter state into Redux unless there is a
demonstrated requirement.

## 3. REDUX STORE STRUCTURE

Keep Redux configuration centralized.

Recommended structure:

```
src/
  store/
    store.ts
    hooks.ts
  features/
    auth/
      authSlice.ts
      authTypes.ts
      authSelectors.ts
    products/
      productsApi.ts
      productTypes.ts
    vendors/
      vendorsApi.ts
    categories/
      categoriesApi.ts
    countries/
      countriesApi.ts
```

## 4. STORE CONFIGURATION

Use configureStore from Redux Toolkit.

Example:

```ts
export const store = configureStore({
  reducer: {
    auth: authReducer,
    [productsApi.reducerPath]: productsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(productsApi.middleware),
});
```

Export:

RootState
AppDispatch

Example:

```ts
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## 5. TYPED REDUX HOOKS

Never repeatedly use raw:

useDispatch()
useSelector()

Create typed hooks.

Example:

```ts
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

Components must use:

useAppDispatch()
useAppSelector()

instead of untyped Redux hooks.

## 6. REDUX SLICE RULE

Use createSlice.

Example:

```ts
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    clearUser(state) {
      state.user = null;
    },
  },
});
```

Do NOT manually mutate Redux state outside reducers.
Do NOT create unnecessary actions.
Keep slices focused on one domain.

## 7. DISPATCH RULES

Dispatch actions only when global client state actually changes.

GOOD:

```ts
dispatch(setUser(user));
dispatch(clearUser());
```

BAD:

```ts
dispatch(setProductName(value)); // on every product form keystroke
```

Product form fields belong to React Hook Form, not Redux.

## 8. NEVER DISPATCH FROM RANDOM UTILITY FILES

Dispatch should normally happen from:

- React components
- custom hooks
- approved middleware/listeners
- explicitly designed application workflows

Do not import the Redux store into random utility/service files and call:

store.dispatch(...)

unless there is a strong architectural reason.

## 9. SELECTOR RULES

Do not repeatedly access deeply nested Redux state directly.

Instead of repeating:

state.auth.user.permissions

create a selector.

Example:

```ts
export const selectCurrentUser = (state: RootState) => state.auth.user;

export const selectPermissions = (state: RootState) =>
  state.auth.user?.permissions ?? [];
```

Use memoized selectors when derived computation is meaningful.
Do not use createSelector unnecessarily for trivial values.

## 10. RTK QUERY IS THE DEFAULT API STATE TOOL

Use RTK Query for backend API communication where client-side querying
or mutation is required.

Examples:

```
GET /products
GET /products/:slug
GET /admin/products
POST /admin/products
PATCH /admin/products/:id
POST /admin/products/:id/publish
POST /admin/products/:id/unpublish
GET /admin/vendors
GET /categories
GET /countries
```

Do NOT create:

productsSlice

just to store the result of:

GET /products

RTK Query already owns that server state.

## 11. API BASE QUERY

Create one shared API configuration.

Example concept:

baseApi

configured with:

NEXT_PUBLIC_API_URL

(This is the exact env var name used across the repo — the Docker Compose
files, the client Dockerfile build arg, and `.env.docker.example` all use
`NEXT_PUBLIC_API_URL`. Do not invent a differently-named variable such as
`NEXT_PUBLIC_API_BASE_URL`; it would not be provided by the deployment.)

Do not repeat API base URLs throughout the application.

## 12. RTK QUERY ENDPOINT NAMING

Use meaningful names.

Examples:

getProducts
getProductBySlug
getAdminProducts
getAdminProductById
createProduct
updateProduct
publishProduct
unpublishProduct
getVendors
getCategories
getCountries

Generated hooks should therefore be clear:

useGetProductsQuery()
useGetAdminProductByIdQuery()
useCreateProductMutation()
useUpdateProductMutation()
usePublishProductMutation()

## 13. QUERY VS MUTATION

Use query for reads.

GET → query

Use mutation for state-changing operations.

POST
PATCH
PUT
DELETE
→ mutation

Do not use mutation for normal reads.

## 14. CACHE TAGS

Use RTK Query cache tags intentionally.

Example:

Product
ProductList
Vendor
Category
Country

After:

createProduct

invalidate the relevant product list.

After:

updateProduct

invalidate/update the affected product.

After:

publishProduct

invalidate:

- admin product
- admin product list
- public product list

After:

unpublishProduct

invalidate:

- admin product
- admin list
- public list
- public detail where applicable

Do not invalidate the entire API cache for every mutation.

## 15. DO NOT DUPLICATE SERVER STATE

BAD:

```
RTK Query
    ↓
API response
    ↓
dispatch(setProducts(response))
    ↓
productsSlice
```

GOOD:

```
RTK Query
    ↓
RTK Query cache
    ↓
Component
```

There must be a clear reason before copying server data into Redux state.

## 16. LOADING STATE

Use RTK Query states where available.

Examples:

isLoading
isFetching
isError
error
data

Do NOT create redundant Redux state:

productLoading
productApiLoading
loadingProducts

when RTK Query already provides it.

## 17. MUTATION STATE

Example:

```ts
const [publishProduct, { isLoading: isPublishing }] =
  usePublishProductMutation();
```

Use:

isPublishing

to disable the Publish button.

Do NOT create another Redux variable for the same operation.

## 18. MUTATION ERROR HANDLING

Handle mutation errors explicitly.

Example concept:

```ts
try {
  await publishProduct(id).unwrap();
  showSuccess(...);
} catch (error) {
  showError(...);
}
```

Never assume a mutation succeeded before the backend confirms it.

## 19. FORM STATE

Use React Hook Form for complex forms.

Product Add/Edit form must NOT be stored field-by-field in Redux.

Example:

```ts
const {
  register,
  control,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<ProductFormValues>();
```

Redux is not a form-state manager.

## 20. FORM VALIDATION

Use the project's approved validation strategy.

If using Zod:

```
ProductForm
     ↓
Zod Schema
     ↓
React Hook Form
     ↓
Validated payload
     ↓
RTK Query mutation
```

Do not maintain different contradictory validation rules in multiple
components.

## 21. CREATE PRODUCT FLOW

Expected architecture:

```
ProductForm
     ↓
React Hook Form
     ↓
Validation
     ↓
createProduct()
     ↓
RTK Query
     ↓
NestJS API
     ↓
Response
     ↓
Success/Error UI
```

Do NOT:

```
ProductForm
     ↓
dispatch every field
     ↓
Redux slice
     ↓
custom async thunk
     ↓
fetch()
```

unless there is a specific requirement.

## 22. DRAFT FLOW

Save Draft:

```
User completes available fields
        ↓
React Hook Form
        ↓
status = DRAFT
        ↓
createProduct/updateProduct mutation
        ↓
Backend
        ↓
Success response
        ↓
Show success feedback
```

Do not mark Draft as saved until backend success.

## 23. PUBLISH FLOW

Publish:

```
Product form
      ↓
Frontend validation
      ↓
Backend request
      ↓
Backend publish validation
      ↓
PUBLISHED
      ↓
Invalidate relevant RTK Query cache
      ↓
Refresh affected UI
```

Backend remains authoritative for publish eligibility.

## 24. AUTH STATE

Authentication state must remain minimal.

Example:

```ts
interface AuthState {
  user: AuthUser | null;
}
```

Do not put unnecessary information into auth state.

User can contain:

id
email
name
roles
permissions

Never store:

password
JWT secret
AWS credentials
database credentials

## 25. PERMISSION SELECTORS

Create reusable permission helpers.

Example concept:

```ts
selectHasPermission(state, "product.publish");
```

Or:

```ts
usePermission("product.publish");
```

UI:

```
canPublish
    ↓
show Publish button
```

But backend authorization is still mandatory.

## 26. REDUX PERSISTENCE

Do NOT persist the entire Redux store.
Do not automatically add redux-persist.
Persist only data that genuinely must survive reloads.
Never persist sensitive information without reviewing the security
implications.

## 27. SERIALIZABLE STATE

Redux state must remain serializable.

Do NOT store:

DOM elements
React components
Promises
functions
class instances
File objects
complex browser objects

Keep these in local state or dedicated APIs as appropriate.

## 28. FILE UPLOAD STATE

Do NOT put actual File objects into Redux.

Product image upload:

```
File input
    ↓
local/form state
    ↓
upload API / S3 flow
    ↓
receive metadata
    ↓
update UI
```

Redux may store only safe serializable metadata if globally required.

## 29. DERIVED STATE

Do not store values that can easily be calculated.

BAD:

products
productCount

if:

productCount = products.length

Calculate derived values when needed.
Store the source of truth, not unnecessary duplicates.

## 30. NORMALIZATION

Do not manually normalize every API response by default.
RTK Query cache is sufficient for most Phase 1 use cases.
Only introduce entity adapters/normalization when a real complexity
requires it.

## 31. ASYNC THUNK RULE

Prefer RTK Query for API calls.
Use createAsyncThunk only for workflows that genuinely do not fit
RTK Query.
Do NOT use createAsyncThunk for every REST endpoint.

## 32. NO DIRECT FETCH IN PRESENTATION COMPONENTS

Avoid:

```ts
const response = await fetch("/api/products");
```

inside ProductCard or random UI components.

Use:

RTK Query

or the project's approved server-side data-fetching layer.

## 33. NEXT.JS SERVER COMPONENT EXCEPTION

Redux/RTK Query is NOT mandatory for server-side data fetching.

If a Next.js Server Component can fetch data cleanly and the data does
not require client-side Redux behavior, prefer the appropriate
server-side approach.

Do not force Redux into every Next.js page.

## 34. REDUX PROVIDER

Redux Provider must be introduced at the appropriate client boundary.

Do NOT convert the entire Next.js root application into a Client
Component simply to support Redux.

Keep the Provider boundary as narrow and correct as possible.

## 35. PRODUCT FILTER STATE

Public catalogue filters should normally use URL state.

Example:

searchParams:

search
category
minPrice
maxPrice
minMoq
maxMoq
country
sort
page

Do NOT create:

productFilterSlice

unless there is a proven requirement that URL state cannot satisfy.

## 36. PAGINATION STATE

Public pagination belongs in the URL.

Example:

?page=3

Admin pagination may also use URL state where practical.
This ensures refresh/back/share behavior remains predictable.

## 37. MODAL STATE

Simple modal:

```ts
const [isOpen, setIsOpen] = useState(false);
```

Do NOT create:

modalSlice

for every modal.

A global modal system may use Redux only when there is a demonstrated
cross-application requirement.

## 38. TOAST / NOTIFICATION STATE

Use the selected notification library/service consistently.
Do not create multiple toast systems.
Do not store historical success notifications in Redux unless required.

## 39. NAMING

Redux slice:

authSlice.ts

API:

productsApi.ts

Selectors:

authSelectors.ts

Types:

productTypes.ts

Hooks:

useProductPermissions.ts

Actions should describe events/state changes clearly:

setUser
clearUser

Avoid:

updateData
setValue
handleState
doAction

## 40. FEATURE OWNERSHIP

Keep feature-specific code together.

Example:

```
features/
  products/
    api/
      productsApi.ts
    components/
      ProductCard.tsx
      ProductForm.tsx
      ProductFilters.tsx
    hooks/
    schemas/
      productFormSchema.ts
    types/
      product.types.ts
    utils/
```

Do not scatter Product domain code randomly throughout the application.

## 41. COMPONENT → STATE DIRECTION

Maintain predictable data flow.

```
API
↓
RTK Query
↓
Component
↓
User action
↓
Mutation / dispatch
↓
State/API update
↓
UI rerender
```

Avoid circular state synchronization.

## 42. ONE SOURCE OF TRUTH

Never maintain the same value simultaneously in:

URL
Redux
local state
form state

unless synchronization is explicitly required.

Choose the correct owner.

Example:

Product search filter → URL
Product form productName → React Hook Form
API products → RTK Query
Modal open → useState
Authenticated user → Auth state

## 43. RECOMMENDED DECISION TABLE

| State | Tool |
| --- | --- |
| API/server data | RTK Query |
| Authenticated user | Redux Toolkit |
| Permissions | Redux/Auth state |
| Product form | React Hook Form |
| Form validation | Zod / approved validator |
| Product search | URL searchParams |
| Product filters | URL searchParams |
| Sorting | URL searchParams |
| Pagination | URL searchParams |
| Modal | useState |
| Dropdown | useState |
| Tabs | local/URL depending UX |
| Product API loading | RTK Query |
| API errors | RTK Query + UI handling |
| Uploaded File object | Local/Form state |

## 44. AI RULE

Before adding Redux state, Kiro/AI must answer:

1. Is this server state?
2. Is this URL state?
3. Is this form state?
4. Is this local UI state?
5. Does it truly need to be global?

Only if the answer to #5 is YES should a new Redux slice normally be
created.

## 45. GOLDEN REDUX RULE

DO NOT USE REDUX JUST BECAUSE REDUX EXISTS.

Use the smallest correct state owner.

Server data      → RTK Query
Global state     → Redux Toolkit
Form state       → React Hook Form
URL state        → searchParams
Local UI state   → useState

---

# Rules that apply to ALL current frontend work (not Redux-gated)

The sections below describe conventions that are in force **today**, with the
code and libraries actually present. They were part of the original frontend
rules and remain authoritative regardless of the Redux adoption above.

## Design system — must match on every screen

- Use the project's Tailwind color tokens / utility classes rather than
  hardcoding hex values in a component. New status displays should reuse the
  existing status-token mapping instead of inventing an ad-hoc tone.
- Keep the established corner radius and the two project fonts
  (`font-heading` for headings, `font-body` for everything else). Don't add
  another font.
- Reuse the existing UI primitives in `src/components/ui/` (e.g. `Button`,
  `Badge`, `Input`, `Panel`, `Table`, `ProductCard`) instead of writing new
  styled elements. If a screen needs a pattern none of them cover, extend the
  primitive (add a variant/prop) rather than building a parallel one-off.

## Three distinct areas — keep them separate

- **Public site**: `src/app/page.tsx` and components under
  `src/components/home/` and `src/components/layout/` (shared header/footer).
- **Vendor portal** (when present): its own route segment, its own
  `components/<area>/` folder, its own data/type files.
- **Sell-with-us wizard**: public-facing vendor signup with its own
  state/types/data — don't merge it into public marketplace data or vendor
  portal internal data.
- A future buyer portal follows the same pattern: its own route segment, its
  own `components/` folder, its own data/types. Don't retrofit buyer concerns
  into vendor/public areas.
- **Never mix seed data across areas.** Public-facing seed data and
  vendor-internal workflow data model different things — don't reuse one for
  the other.

## Routing and data-access patterns

- **Central route constants live in `src/config/routes.ts`.** Never use
  `href="#"` placeholder links — they navigate nowhere and were a real bug in
  this app. Link to a `routes.*` entry (or a `routes.*(param)` helper) with
  `next/link`'s `Link`, even if the target page isn't built yet (Next renders
  404 for a missing page, which is still correct and shareable, unlike `#`).
- Don't index a hardcoded seed object directly from a page/route component.
  Go through a small function in `src/lib/` that returns `T | undefined`, with
  an explicit type, so the page stays agnostic to whether the data is seeded
  today or a real API call later.
- Path alias `@/*` maps to `./src/*` — use it for cross-folder imports rather
  than relative `../../..` paths.

## Responsive layout — avoid mobile horizontal overflow

Don't pin desktop-only fixed dimensions (large fixed widths, big fixed side
paddings, fixed multi-column grids, fixed section heights) without a
responsive fallback. Default to a mobile-friendly layout (stacked / full
width / fewer columns) and apply the desktop sizing at a breakpoint
(`lg:` etc.). Fixed `w-[NNNpx]`, `pr-[NNNpx]`, `grid-cols-4`, and `h-[NNNpx]`
applied unconditionally are the exact shapes that caused horizontal overflow
and clipped content on phones — gate them behind a breakpoint.

## JSX / unicode escapes — a real bug that's happened here

`\uXXXX` / `\u{XXXXX}` escapes are only interpreted inside a real JS string
(inside `{...}` or a template literal), NOT as bare JSX text or a plain
(non-expression) JSX attribute value — React renders the literal backslash-u
text instead.

```tsx
// WRONG — renders the literal text "\u00B7"
<p>{a} \u00B7 {b}</p>
// RIGHT — wrapped in a JS expression
<p>{a} {"\u00B7"} {b}</p>
```

When in doubt, paste the actual unicode character into the source.

## Next.js specifics

- App Router only (`src/app/`). Server Components by default; add
  `"use client"` only where interactivity requires it (forms with `useState`,
  event handlers, `useRouter`, etc. — e.g. the search form in `PrimaryNav`).
- Pages/route files are `.tsx`; shared data/config/type files are `.ts`.
  Reusable domain types live under `src/types/` (one file per concept),
  re-exported through the barrel, rather than ad-hoc inline types.

## Accessibility and images

Use semantic elements and `aria-label`/`aria-hidden` appropriately (e.g. a
`role="search"` form, labelled search input, decorative images marked
`aria-hidden` with empty `alt`). Keep doing this for new interactive elements
and icon-only buttons.
