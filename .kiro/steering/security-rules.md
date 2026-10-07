---
inclusion: always
---

# Security Rules (both apps)

**No authentication or authorization exists in this repo yet** — confirmed
absent in both `react-client` (Login/Signup buttons in `PublicHeader.tsx`
are non-functional placeholders) and `nest-server` (no guards, no JWT, no
passport, no session handling). Every rule below applies from the moment
auth is actually introduced, and some apply already (secrets, logging,
input handling) even without it.

## Non-negotiables

Never:
- Hardcode secrets, API keys, or credentials in source code.
- Commit a real `.env` file (`.env` is gitignored in `nest-server`;
  `.env.example` is the committed template with dummy/LocalStack-safe
  values — keep it that way, never put real credentials in the example
  file either).
- Log passwords, access tokens, refresh tokens, or full AWS credentials.
  `StorageService`/`MessagingService`'s existing `Logger.warn`/`Logger.log`
  calls only ever log resource identifiers (bucket name, key, message ID) —
  match that restraint; don't log full request bodies or SDK config
  objects that could contain secrets.
- Expose AWS credentials to the frontend. The `AWS_ACCESS_KEY_ID`/
  `AWS_SECRET_ACCESS_KEY` in `nest-server/.env.example` are LocalStack
  dummy values (`test`/`test`) — even so, no AWS credential of any kind
  belongs in `react-client`.
- Trust a client-supplied user ID, vendor ID, org ID, or role for
  authorization. **This is the single most important rule for this
  domain** — `Data_Modeling.md`'s Part A.12 ("The two golden rules of data
  separation") documents exactly why: vendor data must be filtered by
  `organization_id` and buyer data by `user_id`, and that filter must come
  from the authenticated session server-side, never from a request
  parameter or body field the client controls. When auth is implemented,
  every vendor/buyer-scoped query must derive its scope from the verified
  identity, not from an `organizationId`/`userId` the client happened to
  send.

## Authentication vs. authorization

Authentication alone (knowing who the request came from) is not
sufficient. Every endpoint that touches vendor-owned or buyer-owned data
must separately verify that the authenticated identity is actually allowed
to access *that specific* resource — an authenticated buyer must not be
able to fetch another buyer's order by guessing an ID; an authenticated
vendor user must not be able to modify another organization's product.
This ownership check happens server-side, on every request, not just at
login.

## Presigned URLs (already implemented — keep this pattern)

`StorageService.getSignedDownloadUrl` already does this correctly: a
time-limited (default 900s) signed URL via `@aws-sdk/s3-request-presigner`,
rather than exposing the bucket/making objects public. Follow this same
approach for any future signed-URL use (uploads, other buckets) — don't
make an S3 bucket public as a shortcut.

## Input validation

No `class-validator` is installed yet (see `backend-rules.md`). Current
validation is manual (`if (!file) throw new BadRequestException(...)`).
Until/unless a validation library is deliberately added, keep validating
required fields explicitly rather than skipping validation because "the
library isn't there yet."

## File uploads

`StorageController.upload` uses `FileInterceptor` (multer, via
`@nestjs/platform-express`) and `StorageService.buildKey` already
sanitizes filenames (`replace(/[^a-zA-Z0-9._-]/g, '_')`) and prefixes them
with a `randomUUID()` to prevent path traversal and filename collisions.
Any new upload endpoint must apply the same sanitization — never use a
client-supplied filename or path segment unsanitized as part of a storage
key.

## CORS, rate limiting

Not yet configured in `nest-server/src/main.ts` (no `app.enableCors()` or
rate-limiting middleware present). This is a gap that should be addressed
before any public-facing write endpoint goes to production, but adding it
speculatively without a concrete need/task is out of scope — flag it if a
task's context makes it relevant (e.g. exposing a new public POST
endpoint), rather than adding it unprompted.

## Money handling (see also `marketplace-domain.md`)

`Data_Modeling.md` Part I, rule 5: money columns must never be JavaScript
floating-point / SQL `FLOAT` — this is a correctness rule as much as a
security one (financial data integrity). See `marketplace-domain.md` for
the full money-modeling convention once a database exists.
