---
inclusion: always
---

# Marketplace Domain Rules

This is an Export Marketplace connecting international buyers with
exporters/vendors. **No database exists yet in `nest-server`** — everything
below describes the *planned* domain model and how to reason about it, not
implemented tables/entities. Do not create all of this speculatively; use
it as the domain boundary reference when a task requires touching one of
these concepts, and implement only what that task needs.

## Source of truth for the domain model

`react-client/Data_Modeling.md` ("Document 4 — Data Modeling", Version 2)
is the authoritative, client-reviewed domain design — 28 proposed
tables covering registration (platform admin / vendor / buyer), products,
inventory, orders, RFQ/quotations, and vendor earnings/payments, plus the
permission model and maker-checker workflow. Treat it as the primary
reference for schema/relationship questions, not the higher-level bullet
lists in the root `README.md` (which is a product-vision document, less
precise about actual structure). If the two ever conflict, `Data_Modeling.md`
is more specific and more recently reviewed — flag the conflict rather than
silently picking one.

This file (`marketplace-domain.md`) summarizes the load-bearing rules from
that document that should govern any implementation touching this domain.
For exact column lists, types, and the full relationship diagram, read
`Data_Modeling.md` directly rather than relying on this summary.

## Core structural rule: Organization = vendor company; buyers have no organization

```
Organization (PLATFORM, 1 row, or VENDOR, many rows)
  └── users (PLATFORM staff or VENDOR staff, via user.organization_id)
        └── products, inventory, orders (vendor side), earnings

Buyer = a plain user row, user.organization_id is always NULL
  └── buyer_profile, buyer_address, RFQs, orders (buyer side)
```

- A vendor company can have multiple users (owner/maker/checker) sharing
  one `organization_id`. A buyer is always a single person, never a
  company — buyers don't get an organization row even if they say "I'm
  buying for a business" (that's `buyer_profile.buyer_type = BUSINESS`,
  still no organization).
- **Don't assume `user === buyer` or `user === vendor`.** A user's role is
  determined by `user_type` (`PLATFORM | VENDOR | BUYER`) plus whether
  `organization_id` is set — not by which route they're currently hitting.
  `Data_Modeling.md` Part J explicitly leaves open whether one person could
  eventually hold both a vendor and buyer role — don't build something that
  makes that structurally impossible unless a task confirms it's out of
  scope.

## The two golden rules of data isolation (security-critical, repeated here because it's this important)

1. Every vendor-owned table/query is scoped by `organization_id`, always
   derived from the authenticated session, never from client input.
2. Every buyer-owned table/query is scoped by `user_id`, same rule.

See `security-rules.md` for why this must never trust client-supplied IDs.
`Data_Modeling.md` Part A.12 calls a violation of this "the most dangerous
bug in a marketplace" — one vendor seeing another vendor's orders.

## Permission-based authorization, not role-name checks

`Data_Modeling.md` Part A.9 is explicit: check permissions
(`user.can('product.approve')`), never role name strings
(`if (user.role == "VENDOR_CHECKER")`). This is so an admin can change what
a role can do from an admin screen without a code deploy. When
authorization is actually implemented, this permission-check pattern is
the one to follow, not a hardcoded role-name switch.

## Product vs. inventory — different concepts, don't conflate

- **Product** = what is being sold: name, description, category, HS code,
  MOQ, price tiers, source country, target countries, media, status
  (maker-checker lifecycle). Belongs to an organization, not to the person
  who created it (`created_by` just records who typed it in).
- **Inventory** = how much is currently available: `quantity_available`,
  `quantity_reserved`, low-stock threshold. Changes constantly; don't store
  it as a general product attribute.
- Reserve, don't immediately decrement, stock when an order is placed
  (`available` drops, `reserved` rises; only decrements `available` for
  real on shipment, restores on rejection) — this is what prevents
  overselling between two simultaneous buyers. Implement this with proper
  transaction/concurrency handling once inventory reservation exists —
  don't do a naive read-then-write that races.

## Product target countries — must be a subset of the vendor's own approved countries

A product's allowed destination countries (`product_target_country`) must
never exceed the vendor's own approved target countries
(`vendor_target_country`) — a product can be *more* restricted than its
vendor's general market list, never less. `Data_Modeling.md` B.4.1
describes the edge cases explicitly: adding a new vendor target country
does not auto-allow existing products there (default to blocked, vendor
opts in); removing a vendor target country cascades to deactivate matching
product rows. A blocked country (`is_allowed = no`) must always carry a
`block_reason` — treat a blocked row with no reason as bad data.

## Compliance — must stay data-driven, not hardcoded per country

Compliance requirements depend on combinations of product + source country
+ destination country + trade type. Do not hardcode country-specific
compliance branches (`if (country === 'USA') { ... }`) scattered through
application code — model compliance as data (required documents,
certifications, restrictions per combination) so a new country or product
type doesn't require a code change. A product may require multiple
documents; documents should carry lifecycle/status, not just a boolean.

## Maker-checker — preserve where it exists

Product changes follow: Maker creates/edits → `PENDING_CHECKER` (vendor's
own checker reviews) → `PENDING_ADMIN` (platform admin reviews) →
`APPROVED`/`PUBLISHED`, or `REJECTED` back to the maker. Two important
rules from `Data_Modeling.md` B.3/A.10: the same person must not be both
maker and checker for the same organization (block this at save time, not
just in UI), and this is a two-*organization* approval chain (vendor's own
checker, then the separate platform organization's admin) — don't collapse
it into a single-step approval.

## Auditability — don't overwrite, append

Approval/rejection history (`product_approval_log`), stock changes
(`stock_movement`), and order status transitions (`order_status_history`)
are append-only history tables — `Data_Modeling.md` Part I rule 10 is
explicit: never edit or delete rows in a `*_history`/`*_log` table; they
are the proof trail. When implementing any workflow with meaningful state
transitions (product approval, order status, compliance document
review, vendor verification, Trade Assurance status), write a new history
row on each transition rather than only updating the current-state column.

## Order line items — snapshot, don't reference-only

`order_item` must copy the product name, HS code, and unit price at the
time of the order (`Data_Modeling.md` D.2) rather than only foreign-keying
to the live `product` row. If a vendor changes their price next month, old
orders/invoices must still show the price that was actually charged —
this is a correctness requirement, not an optimization.

## Trade Assurance — keep it a separate workflow, not embedded in Product/User

Trade Assurance (document submission → verification → review →
approval/rejection → status) should not be tightly coupled directly into
generic Product or User modules — keep it as its own domain concern so its
requirements can evolve independently.

## Money — never floating point, always paired with currency

`Data_Modeling.md` Part I rule 5/6: money columns must use a decimal type
(the doc's own convention is `DECIMAL(19,4)` once a database exists),
never JavaScript floating-point or SQL `FLOAT` — floating point loses
precision and breaks reconciliation. Every monetary amount must be stored
alongside an explicit currency, conceptually:
```
amount    DECIMAL
currency  TEXT   -- e.g. "USD", "INR"
```
A bare number is meaningless in a multi-currency marketplace — `1000`
means nothing, `1000 USD` means something. This applies the moment any
price/order/payment/earning field is implemented, in any layer (DTO,
future database schema, or even a hardcoded seed value used for UI
display).

## Database conventions (apply once a database is actually chosen — none exists yet)

No ORM or database library is installed in `nest-server` today — don't
assume TypeORM, Prisma, Mongoose, or raw `pg` unless a task is explicitly
introducing one; that's an architectural decision to confirm, not infer.
The root README documents an intent to use PostgreSQL for transactional
data and MongoDB for flexible/high-volume data (messages, notifications,
activity logs) — MongoDB is not intended to replace PostgreSQL for
transactional/business-critical records. Once a database is added, these
conventions (drawn from `Data_Modeling.md` Part I) apply:

- Every table gets `created_at` and `updated_at`.
- Prefer soft state (`status` column) over hard deletes for anything with
  trade/financial/audit significance — trade records need to be retained.
- History/log tables are add-only, never edited or deleted (see above).
- Store all timestamps in UTC (buyers and vendors span time zones).
- Add indexes based on actual query/filter/join/sort patterns as they're
  built (`Data_Modeling.md` F.5 flags `vendor_org_id`, `status`,
  `placed_at` on `order` as the first indexes worth adding) — don't add
  indexes speculatively before there's a real query to support.
- Don't denormalize/duplicate relational data without a specific, stated
  reason (the one already-justified exception in the domain doc is
  `order_item` snapshotting product name/price/HS code — a deliberate
  correctness requirement, not casual duplication).
- Prevent overselling via proper transaction/locking when implementing
  inventory reservation — see the product/inventory section above.

## Don't scaffold the whole domain preemptively

The domain boundaries above (User/Buyer/Vendor/Product/Inventory/RFQ/
Quotation/Order/Payment/Compliance/Documents/Trade Assurance/Shipment) are
there to keep a given task's implementation consistent with the eventual
model — not a checklist to build out module-by-module unprompted. Implement
only what the current task actually requires, using these boundaries to
decide *where* it belongs and what it must not violate.
