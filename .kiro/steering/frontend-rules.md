---
inclusion: fileMatch
fileMatchPattern: 'react-client/**'
---

# FRONTEND STATE MANAGEMENT & REDUX RULES

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

NEXT_PUBLIC_API_BASE_URL

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
