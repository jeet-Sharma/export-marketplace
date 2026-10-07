---
inclusion: fileMatch
fileMatchPattern: 'nest-server/**'
---

# API Rules — nest-server REST conventions

The current API surface is small (`GET /`, `/storage/*`, `/messaging/publish`)
and not yet versioned or resource-modeled at scale. These rules set the
convention for what comes next, based on the root README's documented
direction (`/api/v1/...`) and the existing controllers' actual shape.

## Resource-oriented routes

Prefer resource-oriented endpoints over RPC-style verbs-in-the-path:

```
GET    /products
GET    /products/:id
POST   /products
PATCH  /products/:id
DELETE /products/:id
```

not:

```
GET /getProducts
POST /createProduct
```

The one established exception already in this codebase is action-style
sub-resources where the action isn't a plain CRUD verb on the resource
itself — e.g. `GET /storage/download-url` (a derived resource: a signed
URL, not the file), and `POST /messaging/publish` (publishing to a queue
isn't creating a queue resource). Follow that same judgment: if an
operation doesn't map cleanly to create/read/update/delete on a resource,
a clearly-named sub-path is fine; don't force everything into strict CRUD
verbs at the cost of clarity.

## Path params with slashes (already solved once — reuse the fix)

`storage.controller.ts` originally tried `@Param('key')` for an S3 key
containing `/` and it broke route matching. The fix: pass values that can
contain `/` as a query param instead of a path segment
(`GET /storage/download-url?key=...`, `DELETE /storage?key=...`). Apply
the same approach for any future path segment whose value might contain a
slash (S3-style keys, file paths, etc.) — don't re-introduce the bug by
defaulting to a path param out of habit.

## Versioning

The root README documents an intended `/api/v1/...` prefix for the eventual
domain API. No versioning exists yet (`/`, `/storage`, `/messaging` are
unversioned). When the first real domain resource (e.g. `products`) is
added, decide the versioning approach deliberately and apply it
consistently from that point — don't half-version (some routes prefixed,
some not).

## Request/response shape

- DTOs describe the response shape today (`UploadFileResponseDto`); there's
  no request-body validation library yet (see `backend-rules.md`). Keep
  response DTOs as plain typed classes matching that existing style until
  a validation library decision is made.
- Never expose internal error details (stack traces, raw SDK error
  messages, file paths) in an API response. `StorageService`/
  `MessagingService`'s pattern — catch the underlying error, log it
  server-side via `Logger`, and throw a clean Nest exception with a
  user-safe message — is the model. `assertAvailable()`'s message ("File
  storage is unavailable right now...") is a good example of "useful to
  the caller, reveals nothing about implementation."

## Pagination, filtering, sorting, searching

Not yet implemented anywhere in the API (no list endpoint exists yet). When
the first paginated list endpoint is built, define the convention (query
param names, response envelope shape) once and reuse it for every
subsequent list endpoint — don't let each new resource invent its own
pagination shape.

## HTTP status codes already in use, keep consistent

- `400 Bad Request` — missing/invalid input (`BadRequestException`, used in
  both existing controllers for missing required params).
- `503 Service Unavailable` — a dependency (LocalStack/AWS) isn't reachable
  (`ServiceUnavailableException`, from `StorageService`/`MessagingService`).
- Use these same exceptions for the same situations in new code rather than
  inventing new status-code conventions for equivalent cases.

## Authentication/authorization on new endpoints

No authentication exists yet (see `security-rules.md`). Every endpoint
added right now is effectively public. If a task adds an endpoint that
should require authentication or ownership checks and no auth mechanism
exists yet, that's a prerequisite gap to flag — don't add a fake/partial
auth check (e.g. trusting a client-supplied user ID or role) as a
stand-in. See `security-rules.md`'s rule on this.
