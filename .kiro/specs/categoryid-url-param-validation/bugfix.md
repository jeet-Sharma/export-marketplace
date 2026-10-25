# Bugfix Requirements Document

## Introduction

After successfully creating a product via the AddProductModal on the `/dashboard` route, the RTK Query cache invalidation triggers a refetch of `GET /admin/products`. When the URL contains a `categoryId` search param that is not a valid UUID (e.g. a category slug, a display name, or any other non-UUID string), `useProductQueryParams` forwards it verbatim to the API. The backend's `@IsUUID()` validator then rejects the request with a 400 error, causing the product list to fail to reload after creation.

The fix is to validate the `categoryId` URL param in `useProductQueryParams` — the same way `sort` and `status` are already sanitised — so only a well-formed UUID is forwarded to the API. Any non-UUID value must be treated as absent (`undefined`).

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the URL contains a `categoryId` search param whose value is not a valid UUID (e.g. a slug, a display name, or any arbitrary string) THEN the system reads the raw string value and passes it directly to the `GET /admin/products` API call as the `categoryId` query parameter

1.2 WHEN a non-UUID `categoryId` is forwarded to the API and the backend's `@IsUUID()` validator rejects it THEN the system receives a 400 error response and the product list fails to render after a product is created

1.3 WHEN the RTK Query `invalidatesTags: [{ type: "ProductList", id: "LIST" }]` fires after a successful product creation THEN the system refetches all active `getAdminProducts` queries, including the primary list query that carries the invalid `categoryId`, causing the 400 error to surface immediately after creation

### Expected Behavior (Correct)

2.1 WHEN the URL contains a `categoryId` search param whose value is not a valid UUID THEN the system SHALL treat it as absent and resolve `categoryId` to `undefined` in the returned query state

2.2 WHEN `categoryId` resolves to `undefined` due to a non-UUID value in the URL THEN the system SHALL omit the `categoryId` query parameter from the `GET /admin/products` API request, preventing the backend validation error

2.3 WHEN a product is successfully created via the AddProductModal and the cache is invalidated THEN the system SHALL refetch `GET /admin/products` with a valid (or absent) `categoryId` and successfully reload the product list

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the URL contains a `categoryId` search param whose value is a valid UUID THEN the system SHALL CONTINUE TO forward that UUID to the `GET /admin/products` API as the `categoryId` filter, preserving the active category filter

3.2 WHEN the URL contains no `categoryId` search param THEN the system SHALL CONTINUE TO resolve `categoryId` to `undefined` and omit the parameter from the API request

3.3 WHEN the user selects a category from the category dropdown in `ProductControls` THEN the system SHALL CONTINUE TO set a valid UUID as the `categoryId` URL param and apply it as a filter on the product list

3.4 WHEN the user clears the category filter by selecting "All Categories" THEN the system SHALL CONTINUE TO remove the `categoryId` param from the URL and send no `categoryId` to the API

3.5 WHEN other URL params (`sort`, `status`, `search`, `page`) are present alongside an invalid `categoryId` THEN the system SHALL CONTINUE TO apply those other params correctly to the API request
