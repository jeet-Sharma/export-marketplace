# Code Review — feature/phase-01-migration vs main

Scope: all uncommitted/staged changes on `feature/phase-01-migration` (72 files, +6388/-95). `tsc --noEmit` and `oxlint` both pass clean, so everything below is a design/logic/security finding, not a compile or lint error.

## Critical

### 1. `addImage` trusts a client-supplied S3 object key with no ownership check
`src/modules/products/products.service.ts` — `addImage()`, `src/modules/products/dto/create-product-image.dto.ts`

`CreateProductImageDto.objectKey` is just `@IsString() @MinLength(1)`. `requestImageUploadUrl` generates a key server-side via `StorageService.buildKey`, but `addImage` never verifies that the `objectKey` it receives was actually issued for *this* `productId` (or issued at all). Any authenticated admin with `product.edit` on *any* product can call `POST /admin/products/:id/images` with an arbitrary key — e.g. another product's `products/{otherId}/...` key, or any other key that happens to exist in the shared bucket — and it will be persisted as that product's image metadata. There's no signature/token binding the presigned-URL step to the persist step.

Fix: either (a) have `requestImageUploadUrl` return a short-lived signed token/record (e.g. store the issued key + productId + expiry server-side, e.g. in Redis or a DB row) and validate it in `addImage`, or (b) at minimum validate that `objectKey` starts with `products/${productId}/` server-side before trusting it, and consider doing a `HeadObjectCommand` to confirm the object actually exists before persisting.

### 2. Login timing side-channel undermines the stated anti-enumeration goal
`src/modules/auth/auth.service.ts` — `validateCredentials()`

The comment explicitly says the goal is to "never distinguish 'no such email' from 'wrong password'... to avoid leaking which emails are registered." But the code returns immediately on `!user` and only calls `bcrypt.compare` (cost-12, deliberately slow) when a user is found. An attacker can trivially distinguish registered vs. unregistered emails by response time. If enumeration resistance is actually a requirement here (the comment says it is), a dummy `bcrypt.compare` against a fixed hash should run on the not-found path too, so timing is constant. **Confidence: confirmed** (traced the exact code path).

## High

### 3. Slug uniqueness check-then-insert race condition
`src/modules/products/products.service.ts` — `create()` / `generateUniqueSlug()`

`generateUniqueSlug` runs `productRepository.exists({ where: { slug: candidate } })` *outside* the transaction, then the chosen slug is inserted *inside* a separate transaction. Two concurrent `POST /admin/products` requests for products with the same name can both pass the uniqueness check before either commits. The second insert will then violate `UQ_products_slug` at the DB level and throw a raw Postgres `QueryFailedError`, which is not an `HttpException` — it falls through `HttpExceptionFilter`'s catch-all branch and becomes a generic 500, not a clean 409. Low-traffic admin endpoint, but it's a real TOCTOU race, and the failure mode on hit is a confusing 500 instead of a `ConflictException`.

Fix: catch the Postgres unique-violation (`error.code === '23505'`) around the slug insert and retry with a new suffix, or wrap slug allocation in the same transaction with a retry loop, or add an application-level advisory lock / sequence-based suffix instead of count-and-check.

### 4. ~~`@nestjs/observe` wired up with literal placeholder credentials~~ — FALSE POSITIVE, pre-existing
`src/app.module.ts` — `ObserveModule.forRoot({ appKey: 'YOUR_APP_KEY', ... })`

**Verified against `git show 5b336db:nest-server/src/app.module.ts` (the original project scaffold commit on `main`) — this block was already present before any of this session's changes.** I only added imports/config around it (TypeOrmModule, AuthModule, etc.); the ObserveModule block itself is untouched. Not a finding against this change — retracted.

## Medium

### 5. Primary-image race: `isPrimary` demotion isn't guarded against concurrent writers
`src/modules/products/products.service.ts` — `addImage()`

```ts
if (dto.isPrimary) {
  await manager.update(ProductImage, { productId, isPrimary: true }, { isPrimary: false });
}
const image = manager.create(ProductImage, { ...dto, isPrimary: dto.isPrimary ?? false });
return manager.save(ProductImage, image);
```
Two concurrent `addImage(productId, { isPrimary: true })` calls on the same product can both run their `UPDATE ... SET isPrimary = false` before either `INSERT`s, leaving two primary images. There's no unique partial index (`WHERE is_primary`) enforcing "at most one primary per product" at the DB level either — the comment says "Only one primary image per product" is an invariant, but nothing besides this non-atomic read-then-write-then-insert enforces it. Low-traffic admin path, but the invariant as documented isn't actually guaranteed.

Fix: add a partial unique index `(product_id) WHERE is_primary` in the migration, and let the DB reject the second concurrent insert/update rather than relying on application-level ordering.

### 6. `VendorsModule` imports `AuthModule` without clearly using any of its exports
`src/modules/vendors/vendors.module.ts`

```ts
imports: [TypeOrmModule.forFeature([Vendor]), AuthModule],
```
`VendorsController`/`VendorsService` use `JwtAuthGuard` and `PermissionsGuard` from `../auth/guards/...`, both of which are plain `@Injectable()` classes instantiated by Nest's guard resolution — they don't need to be in `VendorsModule`'s own provider graph via module import to work as `@UseGuards(JwtAuthGuard, PermissionsGuard)` decorators (Nest instantiates guards from the global injector when they have no module-scoped dependencies beyond what's globally available, and here neither guard depends on anything `AuthModule`-specific that isn't already resolvable). Compare with `ProductsModule` / `CategoriesModule`, which don't import `AuthModule` at all despite using the same guards. This inconsistency suggests either (a) `VendorsModule`'s import is unnecessary dead wiring, or (b) the other modules are missing an import they actually need. Worth confirming empirically (start the app and hit a guarded `admin/products` route) rather than guessing — but as written, the two module files disagree on whether `AuthModule` needs to be imported for the exact same guards, which is a real conflicting-conventions problem.

**Confidence: likely** — I did not boot the app to confirm Nest resolves the guards without the import; recommend a quick smoke test since the asymmetry alone indicates it's not a deliberate pattern.

### 7. `findOneForAdmin` / `findOneBySlug` bolt ad hoc properties onto a typed entity via `Object.assign`
`src/modules/products/products.service.ts`

```ts
return Object.assign(product, {
  priceTiers,
  targetCountries: productCountries.map((pc) => pc.country),
});
```
`Product` has no `priceTiers`/`targetCountries` fields, so this works at runtime but defeats the type system — callers get back `Product` typed, but the controller signature (`Promise<Product>`) doesn't reflect the extra fields actually being serialized to the client, and nothing stops a future refactor of `Product` from silently colliding with these ad hoc keys. The identical pattern appears twice (admin and public services). Recommend a small `ProductDetailDto`/view-model type that explicitly includes `priceTiers`/`targetCountries` so the controller return type is accurate and both call sites share one shape instead of duplicating the same `Object.assign` pattern.

## Low / Nitpick

### 8. `jwt.config.ts` dev-secret fallback is reasonable but silent
`src/config/jwt.config.ts`, `src/modules/auth/auth.module.ts`

The access/refresh secrets default to hardcoded dev strings if the env vars are absent, documented as intentional. That's a defensible Phase-1 tradeoff for local dev, but there's no startup-time warning logged when the app actually boots with these fallback values — only a code comment. A one-line `Logger.warn` in `AppConfigModule`/bootstrap when `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` are unset would make it much harder to accidentally ship the dev secret to a real environment unnoticed, consistent with the "fail loud, not silent" pattern used elsewhere (e.g. `StorageService`'s 503-on-unreachable-bucket).

### 9. `refreshTokenMaxAgeMs()` regex silently falls back to 7 days on any unparseable format
`src/modules/auth/auth.controller.ts`

If `jwt.refreshExpiresIn` is ever set to something the `/^(\d+)([smhd])$/` regex doesn't match (e.g. `"1w"` or `"604800"`), the cookie's `maxAge` silently becomes 7 days regardless of what the JWT's actual `expiresIn` was set to — so the cookie could outlive or undercut the token's real expiry without any error. Low risk given the config is developer-controlled, but a `Logger.warn` on the fallback path (mirroring the project's "fail loud" convention) would catch a misconfiguration immediately rather than producing a subtly wrong cookie lifetime.

### 10. Repeated null-coalescing boilerplate in `ProductsService.update`/`create`
`src/modules/products/products.service.ts`

The `dto.x !== undefined ? ... : ...` / `dto.x ?? null` pattern is repeated for ~12 fields in both `create()` and `update()`. Not a bug, but a candidate for a small mapper helper (e.g. `toNullable(value)`) to cut the repetition — purely stylistic, skip if you'd rather keep the explicit per-field mapping for readability/traceability against the API spec.

---

## What's solid (worth calling out, not just flagging problems)

- Public catalogue queries (`PublicProductsService`) unconditionally hardcode `status = PUBLISHED` server-side with no client-controllable override — the one boundary that must never leak is enforced correctly, and `findOneBySlug` correctly returns 404 (not 403) for a draft-matching slug to avoid confirming its existence.
- `created_by`/`updated_by` on products are always derived from the authenticated JWT (`user.sub`), never from the request body — checked across `ProductsController.create`/`update` and the DTOs don't expose those fields at all.
- Refresh token rotation re-reads the user's current `status`/roles/permissions from the DB on every refresh rather than trusting stale claims in the refresh token — this correctly closes the "role changed but old token still has old permissions" gap for refresh (though the known accepted tradeoff is that a *revoked* permission still works until the next refresh for the *access* token, which is explicitly documented).
- All foreign keys default to `RESTRICT` with a clear rationale (deletion policy is an open product decision) instead of guessing `CASCADE`.
- Money/quantity columns are consistently kept as `numeric` → string end-to-end (entities, DTOs via `.toString()`), avoiding float precision bugs — this is applied uniformly across `Product`, `ProductPriceTier`.
- `.js` extension ESM imports are applied consistently across every new file, matching the project's module convention.
