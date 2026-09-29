# Export Marketplace Platform
## Document 6 — Complete Data Model (Version 3)

| Field | Value |
|---|---|
| Project | Export Marketplace Platform |
| Covers | **Everything, end to end** — reference data, registration and roles, vendor catalog, inventory, RFQ, cart and checkout, orders and shipments, payments, vendor earnings and payouts, compliance and the bank loop, notifications, special features, marketing content |
| Replaces | `04_Data_Modeling.md` (v2) and `05_Data_Modeling_Buyer.md`. Both stay in the repo as history; **this document is the one to build from** |
| Includes | Every fix from the schema review (IDs `M-xx`, `G-xx`, `H-xx`, `Q-xx`) |
| Engine | PostgreSQL 15 or newer |
| Version | 3 — 25 September 2026 |
| Written for | Developers and the client — plain language first, exact rules second |

> **The one sentence to remember (unchanged from v2):** a **vendor is a company** (`organization`), a **buyer is a person** (`users`). Vendor data is fenced by `organization_id`, buyer data by `user_id`. Everything in this document follows from that.

---

## How to read this document

Each table has three parts:

1. **Columns** — name, type, and what it means in simple words.
2. **Rules** — the constraints and indexes, as real SQL. These are what the **database itself** refuses, not what the app "should remember" to check.
3. **Why** — the reasoning, with the review ID in brackets, e.g. *(M-07)*, so every decision can be traced back to the problem it solves.

Types written like `d_money` or `d_qty` are **domains**. A domain is a named type with its rule built in, defined once in Part 0.3 and reused everywhere.

**Tables marked `[PENDING Q-xx]`** depend on a client decision. They are fully designed so they can be switched on without a redesign, but they are **not built until the client answers**.

---

# PART 0 — Rules for the Whole Database

These apply to **every** table. Where a table section doesn't mention one of them, it still applies.

## 0.1 What changed from Version 2

| # | Change | Review ID |
|---|---|---|
| 1 | `user` → **`users`**, `order` → **`orders`**. Both old names are reserved words in PostgreSQL | M-01 |
| 2 | New **`order_group`** — one parent per checkout, so one payment can cover several vendor orders | M-07 |
| 3 | Delivery and billing addresses are **copied onto the order** (JSONB) instead of linked to the editable address book | M-05 |
| 4 | Stock is **reserved when payment starts**, not after money is taken, and each hold is recorded in **`stock_reservation`** | M-04 |
| 5 | Every money row stores the amount in the vendor's **settlement currency**, so earnings can be added up correctly | M-10 |
| 6 | RFQ messages carry **`vendor_org_id`** — one private thread per vendor | M-06 |
| 7 | Maker ≠ Checker is enforced **per product** (approver ≠ creator), not by blocking role combinations | M-02 |
| 8 | Editing a live product keeps it live — the edit waits in **`pending_changes`** until approved | M-03 |
| 9 | Shipping is quoted **per vendor** inside a checkout | M-08 |
| 10 | A checkout can start from a **cart or an accepted quotation**, so RFQ orders can be paid | M-09 |
| 11 | 22 new tables: `country`, `vendor_bank_account`, `notification`, `notification_delivery`, `bank_pack`, `bank_pack_item`, `shipment`, `organization_status_history`, `audit_log`, `auth_session`, `rfq_recipient`, `commission_rule`, `content`, `order_group`, `stock_reservation`, `rule_requirement`, plus the six compliance tables from Document 3 made concrete | G-01 … G-10 |
| 12 | Renamed: `payment_history` → **`vendor_payout`**, `payment_earning_link` → **`vendor_payout_item`** | H-27 |
| 13 | Removed columns: `order.payment_id`, `order.parent_order_group`, `payment.order_id`, `cart.converted_order_id`, `cart.subtotal`, `cart.item_count`, `cart_item.line_total`, `product_price_tier.currency`, `product.expiry_date`, `user_role.organization_id`, `rfq.vendor_org_id`, `buyer_profile.id` | M-07, H-25, H-15, Q-03, H-12, G-08, H-14 |
| 14 | All statuses are checked lists, all quantities are decimals, all codes are fixed-length with foreign keys | H-01, H-02, H-03 |

**Table count: 68 built tables + 3 pending client decisions.** (Version 2 had 46.)

## 0.2 Naming

| Rule | Example |
|---|---|
| `snake_case` for everything | `order_status_history` |
| Never use SQL reserved words as table or column names | `users`, `orders` — not `user`, `order` |
| Primary key is always `id` | `orders.id` |
| Foreign key is `<thing>_id` | `product_id`, `order_group_id` |
| **`organization_id`** = "this row **belongs to** that vendor company" — it is the row-level security key | `product.organization_id` |
| **`vendor_org_id`** = "this row belongs to a buyer (or to both sides) and **points at** a vendor" | `orders.vendor_org_id`, `cart_item.vendor_org_id` |
| **`buyer_user_id`** = the buyer person on a two-sided row | `orders.buyer_user_id` |
| Booleans start with `is_` / `has_` / `requires_` | `is_default`, `requires_second_approver` |
| Timestamps end in `_at`, dates in `_on` or plain date names | `placed_at`, `expires_at` |

*(H-06)* One name for the tenant column means **one row-level-security policy template** works for every vendor-owned table.

## 0.3 Shared types (domains)

Defined once, used everywhere. A domain carries its own check, so no table can forget it.

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid(), encryption helpers
CREATE EXTENSION IF NOT EXISTS btree_gist; -- exclusion constraints on price tiers, commission periods
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- fuzzy product search

CREATE DOMAIN d_money      AS numeric(19,4);                         -- money; sign allowed (adjustments)
CREATE DOMAIN d_qty        AS numeric(14,3) CHECK (VALUE >= 0);      -- quantities: 2.5 TON is valid
CREATE DOMAIN d_signed_qty AS numeric(14,3);                         -- stock movements (+ in, - out)
CREATE DOMAIN d_rate       AS numeric(18,8) CHECK (VALUE > 0);       -- exchange rates: 0.01201234
CREATE DOMAIN d_percent    AS numeric(6,3)  CHECK (VALUE >= 0 AND VALUE <= 100);
CREATE DOMAIN d_ccy        AS char(3) CHECK (VALUE ~ '^[A-Z]{3}$');  -- ISO 4217: USD, INR
CREATE DOMAIN d_country    AS char(2) CHECK (VALUE ~ '^[A-Z]{2}$');  -- ISO 3166-1: US, IN
CREATE DOMAIN d_unit       AS text CHECK (VALUE IN ('KG','TON','PIECE','BOX','CARTON','LITRE','METRE'));
CREATE DOMAIN d_incoterm   AS text CHECK (VALUE IN ('EXW','FCA','FAS','FOB','CFR','CIF','CPT','CIP','DAP','DPU','DDP'));
CREATE DOMAIN d_sha256     AS char(64) CHECK (VALUE ~ '^[0-9a-f]{64}$');
```

| Domain | Why this exact type |
|---|---|
| `d_money` numeric(19,4) | Never `float` — float loses paise and accounts never match. Four decimals cover every currency plus intermediate rounding |
| `d_qty` numeric(14,3) | Goods sell by weight. An integer can't hold 2.5 tons or 0.75 kg *(H-03)* |
| `d_rate` numeric(18,8) | 1 INR = 0.01201234 USD. Four decimals would round away real money on large orders *(H-02)* |
| `d_ccy`, `d_country` | Fixed-length ISO codes. Each column also gets a **foreign key** to `currency` / `country`, so `'US '` or `'usd'` can never be stored *(H-02)* |
| `d_unit` | One fixed list instead of free text, so `'Kg'`, `'kgs'` and `'KG'` can't all appear |
| `d_incoterm` | Incoterms 2020. In export trade this decides who pays freight and insurance, so it can't be free text *(H-22)* |

## 0.4 Keys

```sql
id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY
public_id uuid   NOT NULL DEFAULT gen_random_uuid() UNIQUE   -- only on tables exposed in URLs
```

- **Internal `id`** is used for joins. It is **never** shown in a URL or an API response *(H-04)*. `/orders/1042` tells a competitor your order volume and invites someone to try `/orders/1043`.
- **Public references** are what the outside world sees: `public_id` (uuid), or a readable number such as `order_number`, `rfq_number`, `payout_ref`.

## 0.5 Status columns

Always `text` with a `CHECK` list — never a free string, never a native Postgres `ENUM`.

```sql
status text NOT NULL DEFAULT 'PENDING'
  CHECK (status IN ('PENDING','APPROVED','SUSPENDED','BLOCKED'))
```

**Why not ENUM?** Adding a value to an enum is easy, but removing or renaming one means rebuilding the type. A `CHECK` is changed with one `ALTER TABLE`. **Why not free text?** One typo (`'APROVED'`) silently drops a row out of every filtered screen *(H-01)*.

## 0.6 Timestamps and the audit columns

| Kind of table | Columns |
|---|---|
| Normal (rows change) | `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at timestamptz NOT NULL DEFAULT now()` — kept current by one shared trigger |
| Append-only (history, logs) | `created_at` only — these rows never change |

```sql
CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
-- attached to every table that has updated_at:
-- CREATE TRIGGER trg_<table>_updated BEFORE UPDATE ON <table>
--   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

All times are stored as `timestamptz` and shown in the viewer's time zone. The database session runs in UTC.

## 0.7 Append-only tables — enforced, not promised

These tables only ever get new rows:

`organization_status_history`, `audit_log`, `product_approval_log`, `stock_movement`, `order_status_history`, `payment_transaction`, `document_review`, `exchange_rate`

The application connects as a database role that **physically cannot** change or delete them *(H-08)*:

```sql
REVOKE UPDATE, DELETE ON organization_status_history, audit_log, product_approval_log,
  stock_movement, order_status_history, payment_transaction, document_review, exchange_rate
  FROM app_rw;
```

A few tables are *mostly* append-only, with one or two columns allowed to change. For those, the permission is granted **per column** (listed in each table's Rules):

```sql
GRANT UPDATE (read_at) ON rfq_message TO app_rw;   -- the message text itself can never change
```

## 0.8 No hard deletes, but personal data can be erased

Business records are never deleted; they get a status such as `ARCHIVED`, `REMOVED` or `CANCELLED`. **But** buyers in the EU (GDPR) and India (DPDP Act 2023) have a legal right to be erased *(H-09)*. Both rules hold because we **anonymise the person and keep the record**:

```
Erasure request for user 501
  users          → full_name='Erased user', email='erased+501@invalid', phone=NULL,
                   password_hash=NULL, status='ANONYMISED', anonymised_at=now()
  buyer_profile  → company_name=NULL, tax_id_enc=NULL
  buyer_address  → every personal field NULL, status='ARCHIVED'
  auth_session, user_social_account, buyer_payment_method → revoked / removed
  orders, invoices, payments → KEPT (legal record); order address snapshots stay
                   because tax law requires the invoice to keep the delivery address
```

The exact retention periods per country are a legal decision for the client.

## 0.9 Encrypted columns

Encrypted with an application-held key (KMS). Stored as `bytea` with a `_enc` suffix, plus a harmless display field where one is needed.

| Column | Display field |
|---|---|
| `vendor_bank_account.account_number_enc` | `account_number_last4` |
| `organization.pan_enc` | — |
| `buyer_profile.tax_id_enc` | — |

We don't encrypt the whole database. Disk-level encryption is on by default at every major cloud host. **Column** encryption is for the few fields that would do real damage if a backup leaked.

## 0.10 Every foreign key gets an index

PostgreSQL indexes primary keys automatically but **not** foreign-key columns *(H-05)*. Without the index, loading an order's lines scans the whole `order_item` table, and changing a parent row locks the child table while Postgres checks it.

> **Rule:** every `*_id` column that is a foreign key has an index, unless it is already the **first** column of a unique constraint or another index. Individual tables below list only the **extra** indexes the hot paths need.

## 0.11 Row-level security (the second lock)

Every query must filter by `organization_id` (vendor data) or `user_id` (buyer data). Row-level security (RLS) makes the database enforce that even if a query in the code forgets it.

```sql
-- once per vendor-owned table
ALTER TABLE product ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON product
  USING (organization_id = current_setting('app.org_id', true)::bigint
         OR current_setting('app.is_platform', true) = 'on');

-- in every request's transaction (works behind PgBouncer in transaction mode)
SET LOCAL app.org_id = '5';
SET LOCAL app.user_id = '11';
SET LOCAL app.is_platform = 'off';
```

**Child tables carry their own `organization_id`** (price tiers, media, target countries, order lines) so their policy is a simple column check, not a join back to the parent on every row *(H-07)*. A **composite foreign key** keeps that copy honest: it can never disagree with the parent *(H-14)*.

The full list of which policy goes on which table is in Part 13.

## 0.12 Lost-update guard

Tables that people edit on screens (`organization`, `product`, `orders`) have `row_version int NOT NULL DEFAULT 1` *(H-10)*:

```sql
UPDATE product SET name = :name, row_version = row_version + 1
 WHERE id = :id AND row_version = :version_the_user_loaded;
-- 0 rows updated → "Someone else changed this product. Reload to see their changes."
```

## 0.13 When we use JSON, and when we don't

> **JSONB** when the data is **written once and read back whole**: never filtered by a field inside it, never added up across rows, never needing a foreign key or a uniqueness rule.
> **A real table** the moment any operation must filter, sum, sort, join or enforce a constraint across its rows.

| Stored as JSONB | Why it is safe |
|---|---|
| `orders.shipping_address`, `billing_address` | Printed on the invoice as a whole; must never change *(M-05)* |
| `orders.tax_breakdown` | Printed; shape differs per country (IGST vs VAT) *(H-22)* |
| `product.attributes` | Category-specific specs (purity %, GSM, alloy grade); shown as a set |
| `product.pending_changes` | A proposed edit, reviewed and applied as one unit *(M-03)* |
| `product.name_i18n`, `description_i18n` | Always read for one language, as a whole *(Q-04)* |
| `payment_transaction.raw_payload`, `shipping_rate_quote.raw_response`, `shipment.tracking_events` | Third-party messages kept as proof, exactly as received |
| `audit_log.before`, `after` | Shape differs per action; read only during investigations |
| `notification.payload`, `content.media`, `requirement_resolution.required_documents` | Rendered whole |
| `hs_code_suggestion_log.suggested_codes`, `featured_export_product.top_destination_countries` | Small lists, display only |

| Kept as real tables even though JSON looks tempting | The query that JSON would break |
|---|---|
| `product_price_tier` | "Which tier covers 600 kg?" — an indexed range lookup on every add-to-cart; the no-overlap rule is a database constraint |
| `order_item` | "Top-selling products this month" — `GROUP BY product_id` across every order |
| `user_role` | One user can't hold the same role twice — a uniqueness constraint JSON can't carry |
| `vendor_document` | "Every document expiring in the next 30 days, for every vendor" — an indexed scan |
| `product_media` | Primary image and order change independently; moderation needs to query media directly |
| `buyer_address` | Several per buyer, one default, picked by id at checkout |

## 0.14 Database roles

| Role | Used by | Can |
|---|---|---|
| `migrator` | Deploy pipeline only | Create and alter tables |
| `app_rw` | The application | Read and write rows (with the append-only limits in 0.7); **no** DDL |
| `app_ro` | Reports and analytics, on the read replica | Read only |

---

# PART 1 — Reference Data

Small tables that change rarely and are read constantly. All of them are **cached in the application** and refreshed when an admin edits them.

## 1.1 `currency`

| Column | Type | Meaning |
|---|---|---|
| `code` | `d_ccy` PK | `USD`, `INR`, `AED`, `EUR` |
| `name` | text | `US Dollar` |
| `symbol` | text | `$` |
| `decimal_places` | smallint | Usually 2; JPY is 0 |
| `is_base` | boolean | The one currency every amount is also stored in, for platform-wide reports |
| `is_active` | boolean | Can buyers pick it |

**Rules**
```sql
CHECK (decimal_places BETWEEN 0 AND 4)
CREATE UNIQUE INDEX currency_one_base ON currency ((true)) WHERE is_base;   -- exactly one base
```

**Why:** the partial unique index makes "two base currencies" physically impossible *(H-28)*. Without it, every report that converts to base could silently use a different base.

## 1.2 `country` 🆕 *(G-01)*

| Column | Type | Meaning |
|---|---|---|
| `code` | `d_country` PK | `US`, `IN`, `AE` |
| `iso3` | char(3) UNIQUE | `USA` |
| `name` | text | `United States` |
| `default_currency` | `d_ccy` FK → currency | Suggested currency for buyers from here |
| `is_active` | boolean | Shown in dropdowns |
| `is_sanctioned` | boolean | Trade blocked by law — no vendor or product may target it |
| `created_at`, `updated_at` | timestamptz | |

**Why:** about 15 columns across the schema hold a country (source, target, destination, delivery, buyer, office, alert). Without a master table they are free text: `'UAE'`, `'AE'` and `'U.A.E'` all look valid. With it, every country column gets a real foreign key, and a sanctioned destination is switched off **in one place**.

## 1.3 `exchange_rate` *(append-only)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `from_currency` | `d_ccy` FK | `USD` |
| `to_currency` | `d_ccy` FK | `INR` |
| `rate` | `d_rate` | Market rate, e.g. 83.25000000 |
| `markup_percent` | `d_percent` | Our margin, if any |
| `effective_rate` | `d_rate` | Rate actually used = rate adjusted by markup |
| `source` | text | Where the rate came from |
| `fetched_at` | timestamptz | When we got it |
| `valid_until` | timestamptz | When it goes stale |

**Rules**
```sql
CHECK (from_currency <> to_currency)
CREATE INDEX exchange_rate_latest ON exchange_rate (from_currency, to_currency, fetched_at DESC);
```

**Why:** rates are **never updated, only added** *(H-28)*. Every checkout and order stores the `exchange_rate_id` it locked, so any invoice can be traced back to the exact rate row it used. "Latest rate for USD→INR" is one index lookup.

## 1.4 `category`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `parent_id` | bigint FK → category, nullable | Parent group: Spices → Whole Spices → Turmeric |
| `name` | text | `Spices` |
| `slug` | text UNIQUE | `whole-spices` — used in URLs |
| `is_active` | boolean | |
| `sort_order` | int | |
| `created_at`, `updated_at` | timestamptz | |

**Rules:** `CHECK (parent_id <> id)`

**Why:** a simple parent link (adjacency list) is enough. The tree is a few hundred rows, so the whole tree is cached in memory and breadcrumbs are built there, not by recursive queries on every page.

## 1.5 `hs_code`

| Column | Type | Meaning |
|---|---|---|
| `code` | char(6) PK | International HS code, digits only: `091030` (shown as `0910.30`) |
| `hs_version` | text | Edition it belongs to: `HS2022` |
| `description` | text | What goods it covers |
| `chapter` | char(2) | First two digits |
| `is_active` | boolean | False once retired in a newer edition |

**Rules:** `CHECK (code ~ '^[0-9]{6}$')`

**Why:** the HS code is 6 digits worldwide. Countries extend it: India's ITC-HS uses 8 digits, the US HTS uses 10. The code the **destination** customs office needs is stored per product per destination, in `product_target_country.national_tariff_code` *(H-17)*. Codes are revised every five years, so old codes are marked inactive, never deleted, and old orders keep the code that was valid when they were placed.

---

# PART 2 — Companies, People and Access

## 2.0 The structure (unchanged idea, tighter rules)

```
PLATFORM organization (exactly one row)
   └── users (user_type = PLATFORM) ── roles: SUPER_ADMIN, ADMIN, OPS, FINANCE, SUPPORT

VENDOR organization (one row per company)          e.g. Sharma Traders
   ├── users (user_type = VENDOR)                   Rahul (Owner), Mohan (Maker), Priya (Checker)
   ├── vendor_target_country                        US, AE
   └── vendor_bank_account                          where payouts go

BUYER (no organization)
   └── users (user_type = BUYER, organization_id = NULL)
         ├── buyer_profile  (one)
         └── buyer_address  (many)
```

**`user_type` means "which panel opens by default".** What a person can actually *do* comes only from their roles and permissions. So a vendor employee who also wants to buy keeps `user_type = VENDOR` and is given the `BUYER` role as well. No second account is needed *(Q-02, default taken)*.

## 2.1 `organization`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | Internal number |
| `public_id` | uuid UNIQUE | Used in URLs |
| `org_type` | text | `PLATFORM` (one row only) or `VENDOR` |
| `legal_name` | text | Official registered name |
| `display_name` | text | Short name on screen |
| `email`, `phone` | text | Main company contact |
| `source_country` | `d_country` FK | Where the goods come **from** |
| `source_currency` | `d_ccy` FK | Currency of that country |
| `settlement_currency` | `d_ccy` FK | Currency the vendor is **paid out** in (usually = source_currency) |
| `address_line1`, `address_line2`, `city`, `state`, `postal_code` | text | Office address |
| `country` | `d_country` FK | Office country |
| `gstin` | text | GST number (printed on invoices, so not secret) |
| `iec_code` | text | Import-Export Code |
| `pan_enc` | bytea | PAN, **encrypted** |
| `requires_second_approver` | boolean, default `true` | If true, a product's creator can never approve it at the Checker step *(M-02, Q-01)* |
| `status` | text | `PENDING`, `APPROVED`, `SUSPENDED`, `BLOCKED` |
| `approved_by` | bigint FK → users | Admin who first approved |
| `approved_at` | timestamptz | |
| `row_version` | int | Lost-update guard |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (org_type IN ('PLATFORM','VENDOR'))
CHECK (status IN ('PENDING','APPROVED','SUSPENDED','BLOCKED'))
CREATE UNIQUE INDEX organization_one_platform ON organization ((true)) WHERE org_type = 'PLATFORM';
CREATE UNIQUE INDEX organization_gstin_uq ON organization (gstin) WHERE gstin IS NOT NULL;
CREATE INDEX organization_by_status ON organization (status);
```

**Why**
- Only **one** platform row can ever exist, so "which org do admins belong to?" has exactly one answer.
- `gstin` and `iec_code` are proper columns because invoices print them *(review: organization tax IDs)*. PAN is encrypted because it is personal to the proprietor for many small exporters.
- `requires_second_approver`: a one-person vendor (Rahul alone) would otherwise be stuck forever, since nobody else could approve his products. When it is `false`, the owner may pass the Checker step, and **platform admin review still follows**. The client decides the default *(Q-01)*.
- Every status change also writes a row to `organization_status_history` (2.2). This table only holds the **current** status.

## 2.2 `organization_status_history` 🆕 *(append-only, G-06)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `organization_id` | bigint FK | Which company |
| `from_status` | text, nullable | Empty for the first row (registration) |
| `to_status` | text | New status |
| `changed_by` | bigint FK → users | Who did it |
| `reason` | text | Why |
| `created_at` | timestamptz | When |

**Rules**
```sql
CHECK (to_status NOT IN ('SUSPENDED','BLOCKED') OR coalesce(btrim(reason),'') <> '')
CREATE INDEX osh_by_org ON organization_status_history (organization_id, created_at);
```

**Why:** "who suspended Sharma Traders, when, and why?" must have an answer. v2 kept only the latest `approved_by`. Suspending or blocking a company without a written reason is refused by the database.

## 2.3 `vendor_target_country`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `organization_id` | bigint FK | Which vendor |
| `target_country` | `d_country` FK | Where they want to sell |
| `target_currency` | `d_ccy` FK | Currency for that market |
| `is_active` | boolean | Currently selling there |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
UNIQUE (organization_id, target_country)   -- also the target of product_target_country's composite FK
```

**Why:** the unique pair lets `product_target_country` point at it with a composite foreign key, so a product **physically cannot** target a country its vendor hasn't declared *(H-16)*. The app also refuses any country with `country.is_sanctioned = true`.

## 2.4 `vendor_bank_account` 🆕 *(G-02)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `organization_id` | bigint FK | Which vendor |
| `account_holder_name` | text | As printed by the bank |
| `account_number_enc` | bytea | Account number, **encrypted** |
| `account_number_last4` | char(4) | For display: `•••• 4821` |
| `ifsc_code` | text, nullable | Indian banks |
| `swift_code` | text, nullable | Overseas |
| `bank_name`, `branch` | text | |
| `currency` | `d_ccy` FK | Account currency |
| `verification_status` | text | `PENDING`, `VERIFIED`, `FAILED` (penny-drop test) |
| `verified_at` | timestamptz | |
| `is_primary` | boolean | Payouts go here |
| `status` | text | `ACTIVE`, `INACTIVE` |
| `created_by` | bigint FK → users | |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (verification_status IN ('PENDING','VERIFIED','FAILED'))
CHECK (status IN ('ACTIVE','INACTIVE'))
CHECK (ifsc_code IS NOT NULL OR swift_code IS NOT NULL)
CREATE UNIQUE INDEX vba_one_primary ON vendor_bank_account (organization_id)
  WHERE is_primary AND status = 'ACTIVE';
```

**Why:** v2 paid vendors but never recorded *where*. Every payout row points to the exact account it was sent to (`vendor_payout.bank_account_id`), so if a vendor changes banks, old payouts still show where the money went. Payouts are only allowed to a `VERIFIED` account (enforced in the payout flow, 12.9). Changing the primary account notifies the vendor owner. That is the standard defence against payout fraud from a hijacked login.

## 2.5 `users` *(renamed from `user`, M-01)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `public_id` | uuid UNIQUE | |
| `user_type` | text | `PLATFORM`, `VENDOR`, `BUYER` — the default panel |
| `organization_id` | bigint FK → organization, nullable | Which company. **Always empty for a buyer** |
| `full_name` | text | |
| `email` | text | Login email |
| `phone` | text | |
| `password_hash` | text, nullable | argon2id / bcrypt. Empty for Google-only users and for invitees who haven't set a password yet |
| `auth_provider` | text | `LOCAL`, `GOOGLE` |
| `email_verified` | boolean | |
| `status` | text | `PENDING`, `ACTIVE`, `BLOCKED`, `ANONYMISED` |
| `failed_login_count` | int, default 0 | Brute-force protection |
| `locked_until` | timestamptz | Login refused until this time |
| `password_changed_at` | timestamptz | Sessions issued before this are invalid |
| `last_login_at` | timestamptz | |
| `anonymised_at` | timestamptz | Set by the erasure procedure (0.8) |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (user_type IN ('PLATFORM','VENDOR','BUYER'))
CHECK (auth_provider IN ('LOCAL','GOOGLE'))
CHECK (status IN ('PENDING','ACTIVE','BLOCKED','ANONYMISED'))
CHECK ((user_type = 'BUYER'  AND organization_id IS NULL) OR
       (user_type <> 'BUYER' AND organization_id IS NOT NULL))
CREATE UNIQUE INDEX users_email_uq ON users (lower(email));
CREATE INDEX users_by_org ON users (organization_id) WHERE organization_id IS NOT NULL;
```
Plus one trigger: a `PLATFORM` user's `organization_id` must be the platform org, and a `VENDOR` user's must be a `VENDOR` org.

**Why**
- Email uniqueness **ignores capital letters** *(H-11)*: `Rahul@x.com` and `rahul@x.com` are one person, which Google-login linking depends on. The app always looks users up by `lower(email)`.
- The CHECK makes "a buyer attached to a company" or "a vendor with no company" impossible to store.
- Lockout and `password_changed_at` *(H-13)*: after a password reset, every earlier session is rejected.
- **One company per person** is the default *(Q-02)*. If the client later needs one person to work for two vendor companies, `organization_member` (Part 14) replaces `users.organization_id` without touching anything else.

## 2.6 `auth_session` 🆕 *(G-07)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `user_id` | bigint FK | |
| `refresh_token_hash` | text UNIQUE | Stored scrambled, never the real token |
| `user_agent` | text | Device / browser |
| `ip` | inet | |
| `created_at` | timestamptz | |
| `last_used_at` | timestamptz | |
| `expires_at` | timestamptz | |
| `revoked_at` | timestamptz | Set on logout, block, or password change |
| `revoked_reason` | text | `LOGOUT`, `USER_BLOCKED`, `PASSWORD_CHANGED`, `ADMIN` |

**Rules**
```sql
CREATE INDEX auth_session_live ON auth_session (user_id) WHERE revoked_at IS NULL;
```

**Why:** without it there's no "log out of all devices," and when a vendor employee leaves, blocking them doesn't end the session they already have open. Blocking a user revokes every live session in the same transaction.

## 2.7 `user_token`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `user_id` | bigint FK | |
| `token_type` | text | `EMAIL_VERIFY`, `PASSWORD_RESET`, `OTP`, `INVITE` |
| `token_hash` | text UNIQUE | Stored scrambled |
| `expires_at` | timestamptz | Reset: 1 hour; invite: 48 hours; OTP: 10 minutes |
| `used_at` | timestamptz | Set once — the token can never be used twice |
| `created_at` | timestamptz | |

**Rules**
```sql
CHECK (token_type IN ('EMAIL_VERIFY','PASSWORD_RESET','OTP','INVITE'))
CREATE INDEX user_token_open ON user_token (user_id, token_type) WHERE used_at IS NULL;
```
A nightly job deletes tokens that expired more than 30 days ago. These are the one exception to "never delete": a spent token has no business or legal value.

**Using a token** is one atomic statement, so two clicks on the same link can't both succeed:
```sql
UPDATE user_token SET used_at = now()
 WHERE token_hash = :hash AND used_at IS NULL AND expires_at > now()
RETURNING user_id;          -- 0 rows = invalid, expired or already used
```

## 2.8 `user_social_account`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `user_id` | bigint FK | |
| `provider` | text | `GOOGLE` |
| `provider_user_id` | text | Google's own id for this person |
| `provider_email` | text | |
| `linked_at` | timestamptz | |

**Rules**
```sql
CHECK (provider IN ('GOOGLE'))
UNIQUE (provider, provider_user_id)
UNIQUE (user_id, provider)
```

**Why:** if someone signs in with Google using an email that already exists, we **link** to the existing user (matched by `lower(email)`) and never create a second account.

## 2.9 `buyer_profile`

| Column | Type | Meaning |
|---|---|---|
| `user_id` | bigint **PK** and FK → users | One profile per buyer — the key itself enforces it *(H-14)* |
| `buyer_type` | text | `INDIVIDUAL`, `BUSINESS` |
| `company_name` | text | Required for business buyers |
| `country` | `d_country` FK | |
| `preferred_currency` | `d_ccy` FK | |
| `preferred_language` | text | `en`, `ar`, `fr` … |
| `tax_id_enc` | bytea | VAT / tax number, **encrypted** |
| `is_verified` | boolean | Optional extra trust |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (buyer_type IN ('INDIVIDUAL','BUSINESS'))
CHECK (buyer_type = 'INDIVIDUAL' OR coalesce(btrim(company_name),'') <> '')
```

**Why:** a business buyer is still **one person** with a company name on their profile. They never get an `organization` row, because organizations are only for vendors (unchanged from v2).

## 2.10 `buyer_address`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `user_id` | bigint FK | |
| `label` | text | `Home`, `Office`, `Warehouse` |
| `contact_name`, `contact_phone` | text | Who receives the goods |
| `address_line1`, `address_line2`, `city`, `state`, `postal_code` | text | |
| `country` | `d_country` FK | |
| `is_default` | boolean | |
| `status` | text | `ACTIVE`, `ARCHIVED` — "delete" archives |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (status IN ('ACTIVE','ARCHIVED'))
CREATE UNIQUE INDEX buyer_address_one_default ON buyer_address (user_id)
  WHERE is_default AND status = 'ACTIVE';
```

**Why:** this is the buyer's **address book**, and it is editable. Orders **never** rely on it after they are placed: the address is copied onto the order (Part 7.2) *(M-05)*. So a buyer can edit or archive any address without changing a single past invoice.

## 2.11 `role`, `permission`, `role_permission`

**`role`**

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `code` | text UNIQUE | `SUPER_ADMIN`, `ADMIN`, `OPS_MANAGER`, `FINANCE_MANAGER`, `SUPPORT`, `VENDOR_OWNER`, `VENDOR_MAKER`, `VENDOR_CHECKER`, `BUYER` |
| `name` | text | Name on screen |
| `scope_type` | text | `PLATFORM`, `VENDOR`, `BUYER` |
| `is_system` | boolean | Built-in; admin can't delete |
| `description` | text | |

**`permission`**

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `code` | text UNIQUE | `product.create`, `product.approve`, `order.accept`, `payout.run` … |
| `module` | text | `Products`, `Orders` … |
| `description` | text | |

**`role_permission`**

| Column | Type | Meaning |
|---|---|---|
| `role_id` | bigint FK | |
| `permission_id` | bigint FK | |

**Rules**
```sql
CHECK (scope_type IN ('PLATFORM','VENDOR','BUYER'))   -- on role
PRIMARY KEY (role_id, permission_id)                   -- on role_permission (H-12)
```

**Why (unchanged principle):** code checks **permissions**, never role names: `user.can('product.approve')`, never `role == 'VENDOR_CHECKER'`. The admin can then change what a role does without a code release. The resolved permission set per user is **cached** with the session and refreshed when an admin edits roles, because this check runs on almost every request.

**Starting permission set for vendor roles**

| Role | Permissions |
|---|---|
| `VENDOR_OWNER` | everything a Maker and a Checker have, plus `user.manage` (own company), `bank_account.manage`, `analytics.view`, `payout.view` |
| `VENDOR_MAKER` | `product.create`, `product.edit`, `inventory.manage`, `rfq.view`, `rfq.quote`, `order.view` |
| `VENDOR_CHECKER` | `product.approve`, `order.view`, `order.accept`, `order.reject`, `order.update_status`, `analytics.view` |
| `BUYER` | `order.place`, `order.view`, `rfq.create`, `cart.use`, `review.write` |

## 2.12 `user_role`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `user_id` | bigint FK | The person |
| `role_id` | bigint FK | The job |
| `assigned_by` | bigint FK → users | Who gave it |
| `assigned_at` | timestamptz | |

**Rules**
```sql
UNIQUE (user_id, role_id)
```
Plus one trigger: a `VENDOR`-scope role can only go to a user whose organization is a vendor, and a `PLATFORM`-scope role only to a platform user.

**Why**
- **`organization_id` is removed** from this table *(H-12)*. The company is already on `users.organization_id`. Two copies could disagree (user row says org 5, role row says org 6), and then nobody knows which company's data that person should see.
- With no nullable column left in the key, a plain `UNIQUE(user_id, role_id)` works, so a buyer can't be given `BUYER` twice.
- **Maker and Checker may be held by the same person.** The rule that matters, "nobody approves their own product," is enforced on the approval itself (Part 3.1) *(M-02)*. Blocking the role *combination* locked out small vendors and still didn't prevent self-approval.

## 2.13 `audit_log` 🆕 *(append-only, G-06)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `actor_user_id` | bigint FK, nullable | Empty for system jobs |
| `actor_org_id` | bigint FK, nullable | Actor's company at that moment |
| `action` | text | `user.block`, `role.grant`, `permission.change`, `vendor.approve`, `bank_account.change` … |
| `entity_type` | text | `users`, `organization`, `role` … |
| `entity_id` | bigint | |
| `before` | jsonb | State before |
| `after` | jsonb | State after |
| `ip` | inet | |
| `user_agent` | text | |
| `created_at` | timestamptz | |

**Rules**
```sql
CREATE INDEX audit_by_entity ON audit_log (entity_type, entity_id, created_at);
CREATE INDEX audit_by_actor  ON audit_log (actor_user_id, created_at);
```

**Why:** Document 3 requires every sensitive admin action to be traceable to a person. This one table covers every entity. `before`/`after` are JSONB because each action has a different shape and the log is read only during investigations. It grows forever, so it is the **first** table to partition by month (Part 13.5).

---

# PART 3 — Vendor Catalog

Products belong to the **company**, never to the person who typed them in. This part carries the platform's heaviest read traffic (browse and search), so its indexes matter most.

## 3.1 `product`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `public_id` | uuid UNIQUE | |
| `organization_id` | bigint FK | **Which company owns it** |
| `category_id` | bigint FK | |
| `hs_code` | char(6) FK → hs_code | International HS code |
| `name` | text | Name in the default language |
| `name_i18n` | jsonb, nullable | `{"ar": "...", "fr": "..."}` *(Q-04)* |
| `slug` | text | URL name, unique within the company |
| `description` | text | |
| `description_i18n` | jsonb, nullable | |
| `sku` | text, nullable | Vendor's own item code |
| `attributes` | jsonb | Category-specific specs: `{"purity_pct": 98, "moisture_pct": 10}` |
| `base_price` | `d_money` | Price per unit in `base_currency` (used when no tier matches) |
| `base_currency` | `d_ccy` FK | Usually the vendor's source currency |
| `moq` | `d_qty` | Minimum order quantity |
| `unit` | `d_unit` | `KG`, `TON`, `PIECE` … |
| `weight_kg` | numeric(12,3) | Weight of one unit, for freight |
| `length_cm`, `width_cm`, `height_cm` | numeric(10,2) | Size of one unit, for freight |
| `is_quote_only` | boolean | "Request quote" only — no Buy button |
| `status` | text | `DRAFT`, `PENDING_CHECKER`, `PENDING_ADMIN`, `APPROVED`, `PUBLISHED`, `REJECTED`, `DELISTED` |
| `pending_changes` | jsonb, nullable | Proposed edit to a live product *(M-03)* |
| `pending_status` | text, nullable | `PENDING_CHECKER`, `PENDING_ADMIN`, `REJECTED` |
| `pending_submitted_by` | bigint FK → users | Who proposed the edit |
| `pending_submitted_at` | timestamptz | |
| `search` | tsvector, generated | Full-text search index |
| `row_version` | int | |
| `created_by` | bigint FK → users | The Maker |
| `published_at` | timestamptz | First time it went live |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (status IN ('DRAFT','PENDING_CHECKER','PENDING_ADMIN','APPROVED','PUBLISHED','REJECTED','DELISTED'))
CHECK (pending_status IS NULL OR pending_status IN ('PENDING_CHECKER','PENDING_ADMIN','REJECTED'))
CHECK ((pending_changes IS NULL) = (pending_status IS NULL))
CHECK (pending_changes IS NULL OR status IN ('PUBLISHED','APPROVED'))  -- edits-in-waiting only exist on live products
CHECK (base_price >= 0 AND moq > 0)

UNIQUE (id, organization_id)                       -- target of children's composite FKs (H-14)
UNIQUE (organization_id, slug)
CREATE UNIQUE INDEX product_sku_uq ON product (organization_id, sku) WHERE sku IS NOT NULL;

ALTER TABLE product ADD COLUMN search tsvector GENERATED ALWAYS AS
  (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,''))) STORED;
CREATE INDEX product_search_gin  ON product USING gin (search);
CREATE INDEX product_name_trgm   ON product USING gin (name gin_trgm_ops);        -- typo-tolerant search
CREATE INDEX product_listing     ON product (category_id, published_at DESC) WHERE status = 'PUBLISHED';
CREATE INDEX product_by_org      ON product (organization_id, status);
CREATE INDEX product_pending     ON product (organization_id, pending_status) WHERE pending_status IS NOT NULL;
```

**Status flow — a new product**
```
Maker creates ──▶ DRAFT ──submit──▶ PENDING_CHECKER ──Checker approves──▶ PENDING_ADMIN
                                          │                                      │
                                          └──reject──▶ REJECTED ◀──reject────────┤
                                                        │ fix                     │ Admin approves
                                                        ▼                         ▼
                                                      DRAFT                   APPROVED ──▶ PUBLISHED ──▶ DELISTED
```

**Status flow — editing a product that is already live** *(M-03)*
```
PUBLISHED product, Maker edits the price
   status          stays PUBLISHED        ← buyers keep seeing and buying the current version
   pending_changes = {"base_price": 4.20}
   pending_status  = PENDING_CHECKER ──▶ PENDING_ADMIN ──▶ approved:
                                                             copy pending_changes onto the real columns,
                                                             write product_approval_log (change_type EDIT),
                                                             clear pending_* — all in one transaction
```

**Approval can't be self-approval** *(M-02)*. The rule sits inside the approve statement, so it can't be skipped or raced:
```sql
-- Checker approves a NEW product
UPDATE product SET status = 'PENDING_ADMIN', row_version = row_version + 1
 WHERE id = :id AND status = 'PENDING_CHECKER'
   AND ( created_by <> :actor
         OR NOT (SELECT requires_second_approver FROM organization WHERE id = product.organization_id) );
-- 0 rows → "You can't approve a product you created."

-- Checker approves an EDIT: same idea, checked against pending_submitted_by
```

**Why**
- **`pending_changes` as JSONB:** an edit is reviewed and applied as one unit, and the JSON doubles as the diff the Checker sees. If the client later wants a browsable history of every edit, it moves to a `product_revision` table. Approved edits are already kept permanently in `product_approval_log.changes_snapshot`, so no history is lost in the meantime.
- **`attributes` as JSONB:** a spice has purity and moisture, a fabric has GSM and weave. One column per possible spec, or an attribute table with one row per value, would both cost more than they return. If one attribute later needs filtering on the category page, a GIN index on `attributes` supports it without a schema change.
- **`expiry_date` is removed** *(Q-03)*: a listing doesn't expire, a batch does. If the client confirms lot tracking, expiry lives on `inventory_lot` (Part 14).
- **Search stays inside Postgres** at launch *(H-18)*: full-text plus trigram covers typos and partial words. A separate search engine is added only when measured load shows the need (Part 13.5).

## 3.2 `product_target_country`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `product_id` | bigint | Which product |
| `organization_id` | bigint | Copy of the owner, for the composite FKs and RLS |
| `target_country` | `d_country` | Destination |
| `national_tariff_code` | text, nullable | Destination's 8–10 digit code, e.g. US HTS `0910300000` *(H-17)* |
| `is_allowed` | boolean | May it be sold there |
| `block_reason` | text | Required when not allowed |
| `created_at`, `updated_at` | timestamptz | |

**Rules** *(H-16)*
```sql
FOREIGN KEY (product_id, organization_id)     REFERENCES product (id, organization_id)
FOREIGN KEY (organization_id, target_country) REFERENCES vendor_target_country (organization_id, target_country)
UNIQUE (product_id, target_country)
CHECK (is_allowed OR coalesce(btrim(block_reason),'') <> '')
CREATE INDEX ptc_buyer_filter ON product_target_country (target_country, product_id) WHERE is_allowed;
```

**Why**
- The second foreign key is Document 4's rule B.4.1, "a product's countries must come from its vendor's own list," enforced by the **database**, not the UI.
- A foreign key only checks that the vendor country **exists**. When a vendor country is set inactive, the cascade job from Document 4 B.4.2 still switches the matching product rows off.
- Blocking a country without a reason is refused.
- `ptc_buyer_filter` serves the buyer's most common filter: "only show products I can have delivered to my country" *(Document 5 C.3 rule 4)*.

## 3.3 `product_price_tier`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `product_id` | bigint | |
| `organization_id` | bigint | Copy of owner (composite FK, RLS) |
| `min_qty` | `d_qty` | From this quantity (included) |
| `max_qty` | `d_qty`, nullable | Up to this quantity (**not** included). Empty = no upper limit |
| `unit_price` | `d_money` | Price per unit in the **product's** `base_currency` |
| `qty_range` | numrange, generated | `[min_qty, max_qty)` |
| `created_at`, `updated_at` | timestamptz | |

**Rules** *(H-15)*
```sql
FOREIGN KEY (product_id, organization_id) REFERENCES product (id, organization_id)
CHECK (max_qty IS NULL OR max_qty > min_qty)
CHECK (unit_price > 0)
ALTER TABLE product_price_tier
  ADD COLUMN qty_range numrange GENERATED ALWAYS AS (numrange(min_qty, max_qty, '[)')) STORED,
  ADD CONSTRAINT tier_no_overlap EXCLUDE USING gist (product_id WITH =, qty_range WITH &&);
```

**Example — Turmeric, priced in INR**

| min_qty | max_qty | unit_price | Reads as |
|---|---|---|---|
| 100 | 500 | 415.00 | 100 ≤ qty < 500 |
| 500 | 1000 | 373.50 | 500 ≤ qty < 1000 |
| 1000 | *(empty)* | 332.00 | 1000 and up |

**Finding the tier for 600 kg** is one index lookup:
```sql
SELECT unit_price FROM product_price_tier
 WHERE product_id = :pid AND qty_range @> 600::numeric;
```

**Why**
- **Tiers can't overlap**, even when two people edit at once: the exclusion constraint refuses it.
- **Half-open ranges** (`max` not included) mean one tier ends exactly where the next begins, so no quantity can fall into a gap between tiers. Inclusive ranges left a gap: 499.5 kg would match neither `100–499` nor `500–999`.
- **The `currency` column is removed.** A tier is always in the product's `base_currency`, so the two can never disagree. Document 5's cart example showed USD tiers while Document 4 said vendors price in INR. Buyers see converted prices; the stored price never changes currency.
- Two rules can't be written as a single-row constraint, so the submit step checks them (`DRAFT → PENDING_CHECKER` is refused otherwise): the first tier's `min_qty` must equal `product.moq`, and there must be no gap between the last tier and the next.

## 3.4 `product_media`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `product_id` | bigint | |
| `organization_id` | bigint | |
| `media_type` | text | `IMAGE`, `VIDEO` |
| `storage_key` | text | Path in object storage, e.g. `org/5/product/101/a1b2.jpg` |
| `mime_type` | text | `image/jpeg` |
| `size_bytes` | bigint | |
| `sha256` | `d_sha256` | Detects duplicates and tampering |
| `is_primary` | boolean | Main picture |
| `sort_order` | int | |
| `moderation_status` | text | `PENDING`, `APPROVED`, `REJECTED` |
| `created_at` | timestamptz | |

**Rules**
```sql
FOREIGN KEY (product_id, organization_id) REFERENCES product (id, organization_id)
CHECK (media_type IN ('IMAGE','VIDEO'))
CHECK (moderation_status IN ('PENDING','APPROVED','REJECTED'))
CREATE UNIQUE INDEX media_one_primary ON product_media (product_id) WHERE is_primary;
```

**Why:** store the **storage key, not the full URL** *(H-19)*. The URL is built at read time, so moving to a new CDN domain doesn't mean rewriting every row.

## 3.5 `product_approval_log` *(append-only)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `product_id` | bigint | |
| `organization_id` | bigint | |
| `stage` | text | `CHECKER` (vendor side), `ADMIN` (platform side) |
| `action` | text | `APPROVED`, `REJECTED` |
| `change_type` | text | `NEW_PRODUCT`, `EDIT` |
| `changes_snapshot` | jsonb | Exactly what was approved or rejected |
| `actor_user_id` | bigint FK → users | Who |
| `comments` | text | Required when rejecting |
| `created_at` | timestamptz | |

**Rules**
```sql
CHECK (stage IN ('CHECKER','ADMIN'))
CHECK (action IN ('APPROVED','REJECTED'))
CHECK (change_type IN ('NEW_PRODUCT','EDIT'))
CHECK (action = 'APPROVED' OR coalesce(btrim(comments),'') <> '')
CREATE INDEX pal_by_product ON product_approval_log (product_id, created_at);
```

**Why:** six months later you can prove who approved which **version** of a product and why. `changes_snapshot` keeps the approved content itself, not just the fact of approval.

---

# PART 4 — Inventory

`inventory` is the one table where two buyers can race for the same row. It follows the **current state + event log** pattern: `inventory` holds only "how much is there right now", for instant lookup and row locking, while `stock_movement` holds "how we got here", for audit.

## 4.1 `inventory`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `product_id` | bigint UNIQUE | One row per product (single warehouse — see note) |
| `organization_id` | bigint | |
| `quantity_available` | `d_qty` | Free to sell right now |
| `quantity_reserved` | `d_qty` | Held for checkouts and unshipped orders |
| `low_stock_threshold` | `d_qty` | Alert below this |
| `unit` | `d_unit` | Same as the product's unit |
| `updated_at` | timestamptz | |

**Rules** *(M-04, H-14)*
```sql
FOREIGN KEY (product_id, organization_id) REFERENCES product (id, organization_id)
CHECK (quantity_available >= 0 AND quantity_reserved >= 0)   -- the last line of defence against overselling
```

**Reserving stock is one atomic statement.** There is no read-then-write gap for a second buyer to slip into:
```sql
UPDATE inventory
   SET quantity_available = quantity_available - :qty,
       quantity_reserved  = quantity_reserved  + :qty,
       updated_at = now()
 WHERE product_id = :pid AND quantity_available >= :qty
RETURNING quantity_available;          -- 0 rows = not enough stock → tell the buyer, reserve nothing
```

| Event | available | reserved |
|---|---|---|
| Start | 1000 | 0 |
| Buyer starts paying for 200 → **reserve** | 800 | 200 |
| Payment captured, order created | 800 | 200 (hold now belongs to the order) |
| Order **shipped** → consume | 800 | 0 |
| *or* order **rejected** / payment failed / hold expired → **release** | 1000 | 0 |

**Note:** `UNIQUE(product_id)` means one warehouse per product. If the client adds multiple warehouses, this becomes `UNIQUE(product_id, warehouse_id)` with a `warehouse` table. Nothing else changes.

## 4.2 `stock_reservation` 🆕 *(M-04)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `product_id` | bigint | |
| `organization_id` | bigint | |
| `checkout_session_id` | bigint FK, nullable | The checkout that took the hold |
| `order_id` | bigint FK, nullable | Filled when the checkout becomes an order |
| `quantity` | `d_qty` | |
| `status` | text | `HELD`, `CONVERTED`, `CONSUMED`, `RELEASED`, `EXPIRED` |
| `expires_at` | timestamptz | = the checkout's expiry while `HELD` |
| `created_at` | timestamptz | |
| `resolved_at` | timestamptz | When it left `HELD` / `CONVERTED` |

**Rules**
```sql
FOREIGN KEY (product_id, organization_id) REFERENCES product (id, organization_id)
CHECK (status IN ('HELD','CONVERTED','CONSUMED','RELEASED','EXPIRED'))
CHECK (num_nonnulls(checkout_session_id, order_id) >= 1)
CHECK (quantity > 0)
CREATE UNIQUE INDEX reservation_one_per_line ON stock_reservation (checkout_session_id, product_id)
  WHERE status = 'HELD';
CREATE INDEX reservation_sweeper ON stock_reservation (expires_at) WHERE status = 'HELD';
```

**Lifecycle**
```
HELD ──payment captured──▶ CONVERTED (order_id set) ──order shipped──▶ CONSUMED
  │                              │
  │                              └──order rejected / cancelled──▶ RELEASED
  ├──payment failed / cancelled──▶ RELEASED
  └──expires_at passed (sweeper, every minute)──▶ EXPIRED
```
Every move out of HELD or CONVERTED adjusts `inventory` and writes a `stock_movement` row **in the same transaction**.

**Why:** in v2, stock was reserved only after the money was taken, so two buyers could both pay for the last 200 kg and one had to be refunded. Now the hold is taken **before** capture. v2's `quantity_reserved` was also a bare number: if a process crashed between reserving and releasing, the stock stayed locked and nobody could say who held it. Now `quantity_reserved` always equals the sum of `HELD` + `CONVERTED` rows, and a nightly check proves it.

## 4.3 `stock_movement` *(append-only)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `product_id` | bigint | |
| `organization_id` | bigint | |
| `movement_type` | text | `PURCHASE_IN`, `RETURN_IN`, `RESERVED`, `RELEASED`, `SALE_OUT`, `ADJUSTMENT`, `DAMAGE` |
| `available_change` | `d_signed_qty` | Change to `quantity_available` (+ in, − out) |
| `reserved_change` | `d_signed_qty` | Change to `quantity_reserved` |
| `available_after` | `d_qty` | `quantity_available` after this row |
| `reserved_after` | `d_qty` | `quantity_reserved` after this row |
| `reference_type` | text | `RESERVATION`, `ORDER`, `MANUAL`, `RETURN` |
| `reference_id` | bigint | The reservation / order id |
| `notes` | text | Required for manual adjustments and damage |
| `created_by` | bigint FK → users, nullable | Empty for system moves |
| `created_at` | timestamptz | |

**Rules** *(H-20)*
```sql
CHECK (movement_type IN ('PURCHASE_IN','RETURN_IN','RESERVED','RELEASED','SALE_OUT','ADJUSTMENT','DAMAGE'))
CHECK (reference_type IN ('RESERVATION','ORDER','MANUAL','RETURN'))
CHECK (movement_type NOT IN ('ADJUSTMENT','DAMAGE') OR coalesce(btrim(notes),'') <> '')
CHECK (available_change <> 0 OR reserved_change <> 0)
CREATE INDEX movement_by_product ON stock_movement (product_id, created_at DESC);
```

**What each movement does**

| movement_type | available_change | reserved_change |
|---|---|---|
| `PURCHASE_IN`, `RETURN_IN` | + qty | 0 |
| `RESERVED` (checkout starts paying) | − qty | + qty |
| `RELEASED` (failed, expired, rejected) | + qty | − qty |
| `SALE_OUT` (order shipped) | 0 | − qty |
| `ADJUSTMENT` | ± qty | 0 |
| `DAMAGE` | − qty | 0 |

**Why:** both balances are recorded, because shipping takes stock out of **reserved**, not out of available. Available already dropped when the stock was reserved. The `*_after` values come from the `RETURNING` clause of the inventory update in the **same transaction**, so they are correct even under concurrency, and replaying the log always rebuilds `inventory` exactly. `reference_type` + `reference_id` point at different tables and so can't have a foreign key; the CHECK keeps the list closed. This table grows the fastest after `audit_log` and is a partitioning candidate (Part 13.5).

## 4.4 `stock_alert`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `product_id` | bigint | |
| `organization_id` | bigint | |
| `alert_type` | text | `LOW_STOCK`, `OUT_OF_STOCK` |
| `current_quantity` | `d_qty` | At the time of the alert |
| `threshold` | `d_qty` | The limit crossed |
| `status` | text | `OPEN`, `NOTIFIED`, `RESOLVED` |
| `notified_at`, `resolved_at` | timestamptz | |
| `created_at` | timestamptz | |

**Rules** *(H-21)*
```sql
CHECK (alert_type IN ('LOW_STOCK','OUT_OF_STOCK'))
CHECK (status IN ('OPEN','NOTIFIED','RESOLVED'))
CREATE UNIQUE INDEX one_open_alert ON stock_alert (product_id) WHERE status IN ('OPEN','NOTIFIED');
```

**Why:** the daily scan can run any number of times without opening a second alert for the same product. The notification itself goes through `notification` (Part 10), which has its own duplicate protection.

---

# PART 5 — RFQ and Quotations

One buyer asks; many competing vendors reply. The central rule: **a vendor must never see another vendor's quote or conversation.**

## 5.1 `rfq`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `rfq_number` | text UNIQUE | `RFQ-2026-0045` |
| `buyer_user_id` | bigint FK → users | Who asked |
| `product_id` | bigint FK, nullable | If asked from a product page |
| `product_name_text` | text, nullable | If typed freely on the dashboard |
| `category_id` | bigint FK | |
| `requirement_text` | text | In the buyer's own words |
| `quantity` | `d_qty` | |
| `unit` | `d_unit` | |
| `target_price` | `d_money`, nullable | The price the buyer hopes for |
| `target_currency` | `d_ccy` FK | |
| `delivery_country` | `d_country` FK | |
| `incoterm` | `d_incoterm`, nullable | Buyer's preferred terms (FOB, CIF …) |
| `expected_delivery_date` | date | |
| `audience` | text | `SINGLE_VENDOR`, `SELECTED`, `OPEN` |
| `status` | text | `OPEN`, `QUOTED`, `ACCEPTED`, `CLOSED`, `EXPIRED` |
| `valid_until` | date | Last date for vendors to reply |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (audience IN ('SINGLE_VENDOR','SELECTED','OPEN'))
CHECK (status IN ('OPEN','QUOTED','ACCEPTED','CLOSED','EXPIRED'))
CHECK (product_id IS NOT NULL OR coalesce(btrim(product_name_text),'') <> '')
CHECK (quantity > 0)
CREATE INDEX rfq_by_buyer ON rfq (buyer_user_id, created_at DESC);
CREATE INDEX rfq_open_match ON rfq (category_id, delivery_country) WHERE status IN ('OPEN','QUOTED');
```

**Why:** `rfq.vendor_org_id` (one vendor, or empty = everyone) is replaced by `audience` + `rfq_recipient` *(G-08)*. That supports "send to these 5 vendors" and records who was notified and who opened it.

## 5.2 `rfq_recipient` 🆕 *(G-08)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `rfq_id` | bigint FK | |
| `vendor_org_id` | bigint FK → organization | A vendor who may see and answer this RFQ |
| `source` | text | `CHOSEN_BY_BUYER`, `MATCHED` (auto-matched for OPEN RFQs) |
| `notified_at` | timestamptz | |
| `viewed_at` | timestamptz | |
| `declined_at` | timestamptz | Vendor said "not for us" |
| `created_at` | timestamptz | |

**Rules**
```sql
CHECK (source IN ('CHOSEN_BY_BUYER','MATCHED'))
UNIQUE (rfq_id, vendor_org_id)
CREATE INDEX rfq_recipient_inbox ON rfq_recipient (vendor_org_id, created_at DESC);
```

**How each audience fills it**

| audience | Rows created |
|---|---|
| `SINGLE_VENDOR` | 1 row, `CHOSEN_BY_BUYER` |
| `SELECTED` | 1 row per chosen vendor |
| `OPEN` | A matching job adds a row for every `APPROVED` vendor that sells in the RFQ's category and has `delivery_country` in its `vendor_target_country` |

**Why:** the vendor's "RFQs for me" screen becomes **one indexed lookup** on `rfq_recipient.vendor_org_id`, instead of matching category and country on every page load. It is also the RLS boundary: a vendor can read an RFQ only if a recipient row exists for their company.

## 5.3 `quotation`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `quotation_number` | text UNIQUE | |
| `rfq_id` | bigint FK | |
| `organization_id` | bigint FK | The replying vendor (owner of this row) |
| `revision` | int, default 1 | 1, 2, 3 as the vendor revises during negotiation |
| `supersedes_id` | bigint FK → quotation, nullable | The revision this one replaces |
| `unit_price` | `d_money` | |
| `currency` | `d_ccy` FK | |
| `quantity` | `d_qty` | Quantity they can supply |
| `total_price` | `d_money` | |
| `lead_time_days` | int | |
| `incoterm` | `d_incoterm` | Who pays freight and insurance *(H-22)* |
| `payment_terms` | text | "30% advance, 70% on delivery" |
| `notes` | text | |
| `valid_until` | date | The price expires after this |
| `status` | text | `SENT`, `SUPERSEDED`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `WITHDRAWN` |
| `created_by` | bigint FK → users | Which vendor user sent it |
| `created_at`, `updated_at` | timestamptz | |

**Rules** *(H-24)*
```sql
CHECK (status IN ('SENT','SUPERSEDED','ACCEPTED','REJECTED','EXPIRED','WITHDRAWN'))
CHECK (unit_price > 0 AND quantity > 0 AND total_price > 0 AND lead_time_days >= 0)
UNIQUE (rfq_id, organization_id, revision)
CREATE UNIQUE INDEX quote_one_live_per_vendor ON quotation (rfq_id, organization_id) WHERE status = 'SENT';
CREATE UNIQUE INDEX quote_one_accepted        ON quotation (rfq_id)                  WHERE status = 'ACCEPTED';
CREATE INDEX quote_expiry ON quotation (valid_until) WHERE status = 'SENT';
```

**Why**
- **One accepted quote per RFQ, enforced by the database.** A double-click on "Choose" or two open tabs can't produce two winners; the second attempt fails on the unique index.
- **Revisions don't overwrite.** When a vendor lowers their price, the old row becomes `SUPERSEDED` and a new row is inserted. The price the buyer already saw stays on record.
- A daily job marks expired quotes `EXPIRED`, and the Choose button checks `valid_until` again inside the accept transaction (Part 12.6).

## 5.4 `rfq_message` *(insert-only except read markers)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `rfq_id` | bigint FK | |
| `vendor_org_id` | bigint FK → organization, **NOT NULL** | Which vendor's thread this message is in *(M-06)* |
| `quotation_id` | bigint FK, nullable | The quote being discussed, if any |
| `sender_user_id` | bigint FK → users | |
| `sender_type` | text | `BUYER`, `VENDOR` |
| `message` | text | |
| `attachment_storage_key` | text | |
| `created_at` | timestamptz | |
| `read_at` | timestamptz | When the other side read it |

**Rules**
```sql
CHECK (sender_type IN ('BUYER','VENDOR'))
FOREIGN KEY (rfq_id, vendor_org_id) REFERENCES rfq_recipient (rfq_id, vendor_org_id)
CREATE INDEX rfq_thread ON rfq_message (rfq_id, vendor_org_id, created_at);
GRANT UPDATE (read_at) ON rfq_message TO app_rw;     -- the text can never be edited
```

**Why:** a conversation is a **pair**, one RFQ and one vendor. In v2, a buyer message written before any quote existed ("Vendor B offered $8.50, can you beat it?") had no vendor on it, so every vendor on the RFQ could read it, including Vendor B. Now each message belongs to exactly one vendor's thread, that thread must be an actual recipient (the foreign key), and RLS shows a vendor only their own thread. Messages can't be edited after sending; they are the record of what was agreed.

---

# PART 6 — Cart and Checkout

## 6.1 `cart`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `user_id` | bigint FK, nullable | Logged-in buyer |
| `anonymous_token_hash` | text, nullable | Visitor not logged in yet *(Q-06)* |
| `status` | text | `ACTIVE`, `CONVERTED`, `ABANDONED`, `MERGED` |
| `currency` | `d_ccy` FK | Currency being shopped in |
| `destination_country` | `d_country` FK | Drives price, duty and availability |
| `converted_order_group_id` | bigint FK → order_group, nullable | What it became *(M-07)* |
| `last_activity_at` | timestamptz | For abandoned-cart detection |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (status IN ('ACTIVE','CONVERTED','ABANDONED','MERGED'))
CHECK (num_nonnulls(user_id, anonymous_token_hash) = 1)
CREATE UNIQUE INDEX cart_one_active_user  ON cart (user_id)              WHERE status = 'ACTIVE';
CREATE UNIQUE INDEX cart_one_active_anon  ON cart (anonymous_token_hash) WHERE status = 'ACTIVE';
CREATE INDEX cart_abandon_scan ON cart (last_activity_at) WHERE status = 'ACTIVE';
```

**Why**
- **`subtotal` and `item_count` are removed** *(H-25)*. Document 5's own rule is "prices in the cart are only a preview, always recompute", so a stored total is stale by definition, and sooner or later some screen shows it. A cart is a handful of rows, so totals are computed when it is read.
- **`converted_order_id` → `converted_order_group_id`.** One multi-vendor cart becomes several orders, and a single order id can't point at all of them *(M-07)*.
- **Visitor carts** are supported *(Q-06, default taken; switch off if the client says no)*. On login, the visitor cart's lines are merged into the user's active cart, and the visitor cart becomes `MERGED`.

## 6.2 `cart_item`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `cart_id` | bigint FK | |
| `product_id` | bigint | |
| `vendor_org_id` | bigint | The vendor selling it — used to split the checkout |
| `quantity` | `d_qty` | |
| `unit` | `d_unit` | |
| `last_shown_price` | `d_money` | Price per unit the buyer last saw |
| `last_shown_currency` | `d_ccy` | |
| `moq_at_add` | `d_qty` | MOQ when added |
| `is_available` | boolean | |
| `unavailable_reason` | text, nullable | `OUT_OF_STOCK`, `DELISTED`, `BLOCKED_FOR_COUNTRY`, `BELOW_MOQ` |
| `added_at`, `updated_at` | timestamptz | |

**Rules**
```sql
FOREIGN KEY (product_id, vendor_org_id) REFERENCES product (id, organization_id)
UNIQUE (cart_id, product_id)
CHECK (quantity > 0)
CHECK (is_available = (unavailable_reason IS NULL))
CHECK (unavailable_reason IS NULL OR
       unavailable_reason IN ('OUT_OF_STOCK','DELISTED','BLOCKED_FOR_COUNTRY','BELOW_MOQ'))
```

**Why**
- **`line_total` is removed** and **`unit_price` becomes `last_shown_price`** *(H-25)*. It is kept only to show "the price changed since you added this". The real price is always the tier lookup (3.3) at the moment of checkout.
- The composite foreign key guarantees `vendor_org_id` really is the product's owner, so the checkout split can't send turmeric to the wrong vendor.
- The buyer sees only the plain reason ("Not available for delivery to this country"), never the vendor's internal `block_reason` (Document 5 C.3, unchanged).

## 6.3 `wishlist`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `user_id` | bigint FK | |
| `product_id` | bigint FK | |
| `note` | text | |
| `added_at` | timestamptz | |

**Rules:** `UNIQUE (user_id, product_id)`

## 6.4 `checkout_session`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `session_ref` | text UNIQUE | Random code used in the web address |
| `user_id` | bigint FK | Buyer |
| `source_type` | text | `CART` or `QUOTATION` *(M-09)* |
| `cart_id` | bigint FK, nullable | Set when `source_type = CART` |
| `quotation_id` | bigint FK, nullable | Set when `source_type = QUOTATION` |
| `shipping_address_id` | bigint FK → buyer_address, nullable | Chosen from the address book |
| `billing_address_id` | bigint FK → buyer_address, nullable | |
| `shipping_address` | jsonb | **Copy** taken when chosen *(M-05)* |
| `billing_address` | jsonb | **Copy** |
| `destination_country` | `d_country` FK | |
| `currency` | `d_ccy` FK | Buyer's currency |
| `exchange_rate_id` | bigint FK → exchange_rate | The exact rate row that was locked |
| `fx_rate` | `d_rate` | Rate locked at start |
| `fx_rate_at` | timestamptz | |
| `subtotal`, `shipping_cost`, `duty_estimate`, `tax_amount`, `discount_amount`, `total_amount` | `d_money` | The locked quote the buyer is paying |
| `status` | text | `STARTED`, `ADDRESS_SET`, `SHIPPING_SET`, `PAYMENT_PENDING`, `COMPLETED`, `EXPIRED`, `FAILED` |
| `expires_at` | timestamptz | Usually start + 30 minutes |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (source_type IN ('CART','QUOTATION'))
CHECK ((source_type = 'CART'      AND cart_id IS NOT NULL AND quotation_id IS NULL) OR
       (source_type = 'QUOTATION' AND quotation_id IS NOT NULL AND cart_id IS NULL))
CHECK (status IN ('STARTED','ADDRESS_SET','SHIPPING_SET','PAYMENT_PENDING','COMPLETED','EXPIRED','FAILED'))
CHECK (status NOT IN ('PAYMENT_PENDING','COMPLETED') OR shipping_address IS NOT NULL)
CREATE INDEX checkout_sweeper ON checkout_session (expires_at)
  WHERE status NOT IN ('COMPLETED','EXPIRED','FAILED');
```

**Why**
- **Stored totals are right here but wrong in the cart.** The cart is a preview; the checkout is the **locked quote** the buyer is about to pay: rate, shipping and duty frozen for 30 minutes. Storing those numbers is the whole point of the table.
- **A checkout can start from an accepted quotation** *(M-09)*. In v2 a checkout required a cart, so an order won through RFQ had no way to be paid.
- **Addresses are copied the moment they're chosen**, so an address-book edit in another tab can't change what the buyer confirmed.

## 6.5 `shipping_rate_quote`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `checkout_session_id` | bigint FK | |
| `vendor_org_id` | bigint FK → organization | **Which vendor's shipment this prices** *(M-08)* |
| `carrier` | text | `DHL`, `FEDEX`, `SEA_FREIGHT` |
| `service_name` | text | `Express`, `Economy` |
| `mode` | text | `AIR`, `SEA`, `EXPRESS`, `ROAD` |
| `cost` | `d_money` | |
| `currency` | `d_ccy` FK | |
| `estimated_days` | int | |
| `estimated_delivery_date` | date | |
| `is_selected` | boolean | |
| `is_estimate` | boolean | True when the carrier's system was down and a saved estimate was shown ("approximate") |
| `raw_response` | jsonb | The carrier's reply, kept as proof |
| `quoted_at` | timestamptz | |
| `valid_until` | timestamptz | |

**Rules**
```sql
CHECK (mode IN ('AIR','SEA','EXPRESS','ROAD'))
CREATE UNIQUE INDEX shipping_one_selected ON shipping_rate_quote (checkout_session_id, vendor_org_id)
  WHERE is_selected;
```

**Why:** a two-vendor cart means **two shipments** from two warehouses, often in different cities. One carrier quote can't price both, and the buyer may want sea freight for the cotton and express for the turmeric. Each vendor group gets its own options and its own selected rate, which is copied onto that vendor's order as `shipping_cost`.

---

# PART 7 — Orders and Shipments

Orders, invoices and shipping papers are **legal records**. Everything shown on them is copied onto the order at the moment of sale.

## 7.1 `order_group` 🆕 *(M-07)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `group_ref` | text UNIQUE | Readable reference shown on the buyer's receipt: `PG-2026-00812` |
| `buyer_user_id` | bigint FK → users | |
| `checkout_session_id` | bigint FK, UNIQUE | One group per checkout |
| `source_type` | text | `CART`, `QUOTATION` |
| `currency` | `d_ccy` FK | Buyer's currency |
| `exchange_rate_id` | bigint FK | |
| `fx_rate` | `d_rate` | Buyer currency → base currency |
| `total_amount` | `d_money` | Sum of its orders, buyer currency |
| `total_amount_base` | `d_money` | Same, platform base currency |
| `created_at` | timestamptz | |

**Why:** the one parent for everything a single checkout produces.

```
         order_group PG-2026-00812   (one checkout, one payment)
           ├── payment      $4,200  CAPTURED
           ├── orders #101  Sharma Spices   $2,700
           └── orders #102  Gupta Textiles  $1,500
                  └── refund $1,500 (Gupta rejected) → payment_id + order_id = exact
```

In v2, `payment.order_id` could hold only one of the two orders, `orders.payment_id` pointed back in a circle, and the sibling orders were tied together by a free-text column. Now "what did this $4,200 charge cover?" is one join, and a partial refund names exactly which order it reverses.

## 7.2 `orders` *(renamed from `order`, M-01)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `order_number` | text UNIQUE | `#101` on screen |
| `order_group_id` | bigint FK | The checkout it came from *(M-07)* |
| `buyer_user_id` | bigint FK → users | **The buyer person** |
| `vendor_org_id` | bigint FK → organization | **The vendor company** |
| `quotation_id` | bigint FK, nullable | If it came from an accepted quote |
| `shipping_address_id` | bigint FK, nullable | Only for "reorder to the same address" |
| `shipping_address` | jsonb **NOT NULL** | Copy at order time *(M-05)* |
| `billing_address` | jsonb **NOT NULL** | Copy at order time |
| `vendor_snapshot` | jsonb **NOT NULL** | Vendor legal name, address, GSTIN, IEC at order time |
| `source_country`, `destination_country` | `d_country` FK | |
| `incoterm` | `d_incoterm` | *(H-22)* |
| `currency` | `d_ccy` FK | Buyer's currency |
| `exchange_rate_id` | bigint FK | |
| `fx_rate` | `d_rate` | Buyer currency → base, locked |
| `fx_rate_at` | timestamptz | |
| `subtotal`, `shipping_cost`, `duty_estimate`, `tax_amount`, `discount_amount`, `total_amount` | `d_money` | Buyer currency |
| `tax_breakdown` | jsonb | `[{"type":"IGST","rate":18,"amount":...}]` *(H-22)* |
| `base_currency` | `d_ccy` | Platform base |
| `total_amount_base` | `d_money` | For platform-wide reports *(M-10)* |
| `settlement_currency` | `d_ccy` | Vendor's payout currency |
| `fx_rate_settlement` | `d_rate` | Buyer currency → settlement currency, locked |
| `total_amount_settlement` | `d_money` | What this order is worth to the vendor *(M-10)* |
| `status` | text | See below |
| `row_version` | int | |
| `placed_at`, `accepted_at`, `delivered_at`, `cancelled_at` | timestamptz | |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (status IN ('PENDING','ACCEPTED','REJECTED','PROCESSING','READY_TO_SHIP',
                  'SHIPPED','IN_TRANSIT','DELIVERED','CANCELLED'))
CHECK (total_amount >= 0 AND total_amount_base >= 0 AND total_amount_settlement >= 0)
UNIQUE (id, vendor_org_id)                                     -- target of order_item's composite FK
CREATE UNIQUE INDEX order_one_per_quote ON orders (quotation_id) WHERE quotation_id IS NOT NULL;  -- H-24
CREATE INDEX orders_vendor_board ON orders (vendor_org_id, status, placed_at DESC);   -- H-23
CREATE INDEX orders_buyer_list   ON orders (buyer_user_id, placed_at DESC);
CREATE INDEX orders_by_group     ON orders (order_group_id);
```

**Status flow** (unchanged from v2)
```
PENDING ──accept──▶ ACCEPTED ──▶ PROCESSING ──▶ READY_TO_SHIP ──▶ SHIPPED ──▶ IN_TRANSIT ──▶ DELIVERED
   │
   ├──reject──▶ REJECTED      (refund + stock release, Part 12.5)
   └──cancel──▶ CANCELLED
```

**Every status change is a guarded update** in the same transaction as its history row, so a double-clicked "Accept" does nothing the second time *(H-23)*:
```sql
UPDATE orders SET status = 'ACCEPTED', accepted_at = now(), row_version = row_version + 1
 WHERE id = :id AND status = 'PENDING'
RETURNING id;          -- 0 rows → already accepted, rejected or cancelled
```

**Why**
- **Three currencies, each for one job** *(M-10)*. The buyer's currency is what the buyer paid and the invoice shows. The base currency is for platform-wide reports. The settlement currency is what the vendor is owed. In v2, earnings added up USD and AED as one number. Now each total is summed over a single-currency column.
- **`payment_id` and `parent_order_group` are removed.** Payment is reached through `order_group` *(M-07)*.
- **`vendor_snapshot`**: the vendor's legal details at the moment of sale. If Sharma Traders later changes its registered name or address, old invoices keep the old ones.

## 7.3 `order_item`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `order_id` | bigint | |
| `organization_id` | bigint | The vendor (copy, for RLS and the composite FK) |
| `product_id` | bigint FK | For reporting joins only — never for display |
| `product_name` | text | **Copy** at order time |
| `product_sku` | text | **Copy** |
| `hs_code` | char(6) | **Copy** |
| `national_tariff_code` | text | **Copy** for the destination |
| `unit` | `d_unit` | |
| `quantity` | `d_qty` | |
| `unit_price` | `d_money` | Price actually charged (tier, or quoted price) |
| `line_total` | `d_money`, generated | `round(quantity × unit_price, 4)` |
| `currency` | `d_ccy` | |
| `created_at` | timestamptz | |

**Rules**
```sql
FOREIGN KEY (order_id, organization_id) REFERENCES orders (id, vendor_org_id)
CHECK (quantity > 0 AND unit_price >= 0)
ALTER TABLE order_item ADD COLUMN line_total d_money
  GENERATED ALWAYS AS (round(quantity * unit_price, 4)) STORED;
CREATE INDEX order_item_by_product ON order_item (product_id, created_at);  -- "top products" report
```

**Why:** the snapshot rule is unchanged. An invoice never changes because a vendor later edits a price or name. `line_total` is now a **generated column**, so it can never disagree with quantity × price. It stays a real table, not JSON on the order, because the most common report ("top-selling products") is a `GROUP BY product_id` across every order.

**Partial acceptance** (accept 3 of 4 lines) is **not** supported *(Q-05, default taken)*: a vendor accepts or rejects the whole order. If the client wants it, `order_item` gets its own `status` and refunds become per line.

## 7.4 `order_status_history` *(append-only)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `order_id` | bigint FK | |
| `from_status` | text, nullable | |
| `to_status` | text | |
| `changed_by` | bigint FK → users, nullable | Empty when the system changed it (payment capture, carrier update) |
| `reason` | text | Required for reject and cancel |
| `created_at` | timestamptz | |

**Rules**
```sql
CHECK (to_status NOT IN ('REJECTED','CANCELLED') OR coalesce(btrim(reason),'') <> '')
CREATE INDEX osh_by_order ON order_status_history (order_id, created_at);
```

## 7.5 `shipment` 🆕 *(G-05)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `shipment_ref` | text UNIQUE | |
| `order_id` | bigint FK | |
| `vendor_org_id` | bigint FK | |
| `carrier` | text | `DHL`, `MAERSK` … |
| `mode` | text | `AIR`, `SEA`, `EXPRESS`, `ROAD` |
| `service_name` | text | |
| `awb_or_bl_number` | text | Air waybill or bill of lading number |
| `tracking_number` | text | |
| `tracking_url` | text | |
| `container_number` | text | Sea freight |
| `shipped_at`, `delivered_at` | timestamptz | |
| `status` | text | `BOOKED`, `PICKED_UP`, `IN_TRANSIT`, `CUSTOMS_HOLD`, `DELIVERED`, `RETURNED`, `CANCELLED` |
| `tracking_events` | jsonb | Carrier's raw tracking updates, appended |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (mode IN ('AIR','SEA','EXPRESS','ROAD'))
CHECK (status IN ('BOOKED','PICKED_UP','IN_TRANSIT','CUSTOMS_HOLD','DELIVERED','RETURNED','CANCELLED'))
CREATE INDEX shipment_by_order ON shipment (order_id);
CREATE INDEX shipment_tracking ON shipment (carrier, tracking_number);
```

**Why:** v2 had order statuses SHIPPED and IN_TRANSIT, but nowhere to store the carrier, AWB or tracking number. This is its own table because one order may ship in parts, and the carrier's tracking webhook looks shipments up by `(carrier, tracking_number)`. The carrier's own event format is kept as JSONB proof. Shipment statuses drive `orders.status` (SHIPPED, IN_TRANSIT, DELIVERED).

## 7.6 `order_document` *(new versions only — never overwrite)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `order_id` | bigint FK | |
| `document_type` | text | `COMMERCIAL_INVOICE`, `PACKING_LIST`, `SHIPPING_BILL`, `CERTIFICATE_OF_ORIGIN`, `PAYMENT_RECEIPT` |
| `document_number` | text | Official number printed on it |
| `version` | int | 1, 2, 3 … |
| `supersedes_id` | bigint FK → order_document, nullable | |
| `storage_key` | text | PDF location |
| `sha256` | `d_sha256` | Proves the file hasn't been altered |
| `is_buyer_visible` | boolean | |
| `generated_by` | bigint FK → users | |
| `generated_at` | timestamptz | |

**Rules**
```sql
CHECK (document_type IN ('COMMERCIAL_INVOICE','PACKING_LIST','SHIPPING_BILL',
                         'CERTIFICATE_OF_ORIGIN','PAYMENT_RECEIPT'))
UNIQUE (order_id, document_type, version)
REVOKE UPDATE, DELETE ON order_document FROM app_rw;
GRANT  UPDATE (is_buyer_visible) ON order_document TO app_rw;   -- visibility is the only thing that changes
```

---

# PART 8 — Buyer Payments

Money coming **in**. Three tables because one payment can fail, be retried, then succeed. The whole story must be kept, not just the last line.

## 8.1 `payment`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `payment_ref` | text UNIQUE | Our readable reference |
| `idempotency_key` | text UNIQUE | Sent by the browser; a repeated "Pay" click reuses it *(H-26)* |
| `user_id` | bigint FK → users | Buyer |
| `order_group_id` | bigint FK, nullable | Filled when capture creates the group *(M-07)* |
| `checkout_session_id` | bigint FK | |
| `gateway` | text | `RAZORPAY`, `PAYPAL`, `BANK_TRANSFER` |
| `gateway_payment_id` | text | Gateway's id |
| `gateway_order_id` | text | Gateway's order id |
| `method` | text | `CARD`, `NETBANKING`, `UPI`, `WALLET`, `PAYPAL_BALANCE`, `BANK_TRANSFER` |
| `amount` | `d_money` | |
| `currency` | `d_ccy` FK | |
| `amount_in_base_currency` | `d_money` | |
| `base_currency` | `d_ccy` | |
| `fx_rate` | `d_rate` | |
| `amount_refunded` | `d_money`, default 0 | Running total of completed and in-flight refunds |
| `status` | text | `INITIATED`, `AUTHORIZED`, `CAPTURED`, `FAILED`, `CANCELLED`, `PARTIALLY_REFUNDED`, `REFUNDED` |
| `failure_code`, `failure_reason` | text | |
| `initiated_at`, `authorized_at`, `captured_at` | timestamptz | |
| `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (gateway IN ('RAZORPAY','PAYPAL','BANK_TRANSFER'))
CHECK (status IN ('INITIATED','AUTHORIZED','CAPTURED','FAILED','CANCELLED','PARTIALLY_REFUNDED','REFUNDED'))
CHECK (amount > 0 AND amount_refunded >= 0 AND amount_refunded <= amount)   -- can never refund more than taken
CREATE UNIQUE INDEX payment_gateway_id ON payment (gateway, gateway_payment_id) WHERE gateway_payment_id IS NOT NULL;
CREATE UNIQUE INDEX payment_one_capture_per_checkout ON payment (checkout_session_id)
  WHERE status IN ('CAPTURED','PARTIALLY_REFUNDED','REFUNDED');                -- never charge twice
CREATE INDEX payment_by_user ON payment (user_id, initiated_at DESC);
```

**Status only moves forward** *(H-26)*. Gateways sometimes deliver "captured" before "authorized"; the late message must not undo the capture:
```sql
UPDATE payment SET status = 'CAPTURED', captured_at = now()
 WHERE id = :id AND status IN ('INITIATED','AUTHORIZED');     -- a late 'authorized' finds 0 rows: harmless
```

**Why**
- **`order_id` is removed**, replaced by `order_group_id` *(M-07)*: one payment covers every order in the checkout.
- **Double charging is impossible at the database level.** A retried click reuses the `idempotency_key`, and at most one payment per checkout can ever reach CAPTURED.
- **Over-refunding is impossible.** `amount_refunded` is raised inside the refund transaction while the payment row is locked, and the CHECK refuses anything above `amount`.
- **Authorized vs captured** (unchanged): authorized means the bank has blocked the money; captured means it moved. This platform captures at payment and holds the funds under Trade Assurance until delivery (Part 9).

## 8.2 `payment_transaction` *(append-only, except `processed_at`)*

Every message the gateway sends us, exactly as received.

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `gateway` | text | |
| `gateway_event_id` | text | Gateway's id for this message |
| `payment_id` | bigint FK, nullable | Matched payment. Empty if we can't match it yet |
| `event_type` | text | `CREATED`, `AUTHORIZED`, `CAPTURED`, `FAILED`, `REFUNDED`, `DISPUTE_OPENED` |
| `amount` | `d_money` | |
| `currency` | `d_ccy` | |
| `raw_payload` | jsonb | Full message |
| `signature_verified` | boolean | We checked it really came from the gateway |
| `received_at` | timestamptz | |
| `processed_at` | timestamptz | When our system acted on it |

**Rules**
```sql
UNIQUE (gateway, gateway_event_id)                                  -- duplicate messages stop here
CREATE INDEX ptx_unprocessed ON payment_transaction (received_at) WHERE processed_at IS NULL;
CREATE INDEX ptx_by_payment  ON payment_transaction (payment_id, received_at);
REVOKE UPDATE, DELETE ON payment_transaction FROM app_rw;
GRANT  UPDATE (payment_id, processed_at) ON payment_transaction TO app_rw;
```

**Why: receive first, process second** (the standard "inbox" pattern)
1. The webhook handler does only two things: verify the signature and **insert** the row. If `gateway_event_id` already exists, the insert fails, and a duplicate message ends there *(unchanged rule, now with the gateway in the key)*.
2. A worker picks up unprocessed rows and applies them, using the forward-only update from 8.1.
3. A message that arrives before our own payment row is visible stays unprocessed and is retried. It is never lost.

An unsigned message is stored with `signature_verified = false` and **never** processed. It is kept only as evidence of a forgery attempt.

## 8.3 `refund`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `refund_ref` | text UNIQUE | |
| `idempotency_key` | text UNIQUE | So a retried refund call can't refund twice |
| `payment_id` | bigint FK | Original payment |
| `order_id` | bigint FK | **Which order** in the group this reverses |
| `gateway_refund_id` | text, nullable | |
| `amount` | `d_money` | |
| `currency` | `d_ccy` | Same as the payment |
| `reason` | text | `VENDOR_REJECTED`, `COMPLIANCE_FAILED`, `BUYER_CANCELLED`, `DELIVERY_FAILED`, `GOODWILL` |
| `status` | text | `INITIATED`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `requested_by` | bigint FK → users, nullable | Empty when automatic (vendor rejected) |
| `initiated_at`, `completed_at` | timestamptz | |
| `failure_reason` | text | |

**Rules**
```sql
CHECK (amount > 0)
CHECK (reason IN ('VENDOR_REJECTED','COMPLIANCE_FAILED','BUYER_CANCELLED','DELIVERY_FAILED','GOODWILL'))
CHECK (status IN ('INITIATED','PROCESSING','COMPLETED','FAILED'))
CREATE UNIQUE INDEX refund_gateway_id ON refund (gateway_refund_id) WHERE gateway_refund_id IS NOT NULL;
CREATE INDEX refund_by_order ON refund (order_id);
```
Plus one check in the refund transaction: the order belongs to the payment's `order_group`.

**Why:** with the group, a vendor rejecting **one** of two orders produces a refund for exactly that order's total against the shared payment. If the refund **fails** at the gateway, `payment.amount_refunded` is lowered again in the same transaction that marks it `FAILED`.

## 8.4 `buyer_payment_method`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `user_id` | bigint FK | |
| `gateway` | text | |
| `gateway_token` | text | **A token from the gateway — never a card number** |
| `method_type` | text | `CARD`, `PAYPAL`, `BANK` |
| `display_label` | text | `Visa •••• 4242` |
| `expiry_month`, `expiry_year` | smallint | Display only |
| `is_default` | boolean | |
| `status` | text | `ACTIVE`, `REMOVED` |
| `created_at` | timestamptz | |

**Rules**
```sql
UNIQUE (gateway, gateway_token)
CHECK (status IN ('ACTIVE','REMOVED'))
CREATE UNIQUE INDEX bpm_one_default ON buyer_payment_method (user_id) WHERE is_default AND status = 'ACTIVE';
```

**Why (unchanged, and the most important security rule in the project):** never store a card number, CVV or full expiry. The gateway keeps the card; we keep a meaningless token. This keeps the platform out of PCI-DSS card-data scope.

---

# PART 9 — Vendor Earnings and Payouts

Money going **out**. Built as a small ledger: amounts are never edited. A correction is a new row.

## 9.1 `commission_rule` 🆕 *(G-09)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `scope_type` | text | `PLATFORM` (default for everyone), `CATEGORY`, `ORGANIZATION` (negotiated) |
| `category_id` | bigint FK, nullable | For `CATEGORY` |
| `organization_id` | bigint FK, nullable | For `ORGANIZATION` |
| `rate_percent` | `d_percent` | |
| `effective_from` | date | |
| `effective_to` | date, nullable | Empty = until further notice |
| `created_by` | bigint FK → users | |
| `created_at` | timestamptz | |

**Rules**
```sql
CHECK (scope_type IN ('PLATFORM','CATEGORY','ORGANIZATION'))
CHECK ((scope_type = 'PLATFORM'     AND category_id IS NULL     AND organization_id IS NULL) OR
       (scope_type = 'CATEGORY'     AND category_id IS NOT NULL AND organization_id IS NULL) OR
       (scope_type = 'ORGANIZATION' AND organization_id IS NOT NULL AND category_id IS NULL))
CHECK (effective_to IS NULL OR effective_to > effective_from)
ALTER TABLE commission_rule ADD CONSTRAINT commission_no_overlap EXCLUDE USING gist (
  scope_type WITH =, (coalesce(category_id, 0)) WITH =, (coalesce(organization_id, 0)) WITH =,
  (daterange(effective_from, effective_to, '[)')) WITH &&);
```

**Which rate applies:** the most specific rule valid on the order date wins: `ORGANIZATION` over `CATEGORY` over `PLATFORM`.

**Why:** v2 snapshotted a `commission_rate` on each earning but never said where it came from. Now an admin changes rates without a code release, two rules can't overlap for the same scope and date, and past earnings keep the rate they were snapshotted with.

## 9.2 `vendor_earning` *(ledger)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `organization_id` | bigint FK | The vendor |
| `order_id` | bigint FK | |
| `entry_type` | text | `EARNING`, `REFUND_ADJUSTMENT`, `COMMISSION_ADJUSTMENT`, `MANUAL_ADJUSTMENT` *(H-27)* |
| `gross_amount` | `d_money` | Order value (signed) |
| `commission_rule_id` | bigint FK, nullable | Rule used |
| `commission_rate` | `d_percent` | Snapshot |
| `commission_amount` | `d_money` | |
| `tax_amount` | `d_money` | e.g. TDS / TCS withheld |
| `net_amount` | `d_money` | What the vendor gets (signed), order currency |
| `currency` | `d_ccy` | Order currency |
| `settlement_currency` | `d_ccy` | Vendor's payout currency |
| `fx_rate_settlement` | `d_rate` | The order's locked rate |
| `net_amount_settlement` | `d_money` | **The number the dashboard adds up** *(M-10)* |
| `status` | text | `PENDING`, `PAYABLE`, `ON_HOLD`, `PAID` |
| `related_refund_id` | bigint FK → refund, nullable | For `REFUND_ADJUSTMENT` |
| `notes` | text | Required for manual adjustments |
| `earned_at` | timestamptz | |
| `paid_at` | timestamptz | |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (entry_type IN ('EARNING','REFUND_ADJUSTMENT','COMMISSION_ADJUSTMENT','MANUAL_ADJUSTMENT'))
CHECK (status IN ('PENDING','PAYABLE','ON_HOLD','PAID'))
CHECK (entry_type <> 'REFUND_ADJUSTMENT' OR related_refund_id IS NOT NULL)
CHECK (entry_type <> 'MANUAL_ADJUSTMENT' OR coalesce(btrim(notes),'') <> '')
CREATE UNIQUE INDEX earning_one_per_order ON vendor_earning (order_id) WHERE entry_type = 'EARNING';
CREATE INDEX earning_payable ON vendor_earning (organization_id, status, earned_at);
REVOKE UPDATE ON vendor_earning FROM app_rw;
GRANT  UPDATE (status, paid_at, updated_at) ON vendor_earning TO app_rw;   -- amounts are frozen once written
```

**Example — a refund after the vendor was paid**

| entry_type | net_amount_settlement | status |
|---|---|---|
| EARNING | +224,775.00 INR | PAID |
| REFUND_ADJUSTMENT | −24,975.00 INR | PAYABLE |
| **Balance (SUM)** | **199,800.00 INR** | the next payout deducts 24,975 |

**Why**
- In v2 there was one row per order, so a refund after payout could only be handled by editing a row that had already been paid. That destroys the audit trail. Now the balance is always `SUM(net_amount_settlement)`, and money columns can't be edited by the application at all.
- **Dashboard earnings** = `SUM(net_amount_settlement)` for one vendor, which is always one currency *(M-10)*.
- **When an earning becomes `PAYABLE`** is the Trade Assurance hold: after `DELIVERED` plus a holding period set by the client (default 7 days). Open disputes put it `ON_HOLD`.
- This is a **minimal ledger**, not full double-entry accounting. It is enough for launch; double-entry can be added later without changing these rows.

## 9.3 `vendor_payout` *(renamed from `payment_history`, H-27)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `payout_ref` | text UNIQUE | |
| `organization_id` | bigint FK | |
| `bank_account_id` | bigint FK → vendor_bank_account | **Where it was actually sent** *(G-02)* |
| `amount` | `d_money` | |
| `currency` | `d_ccy` | |
| `payment_method` | text | `BANK_TRANSFER`, `RAZORPAY_X`, `PAYPAL` |
| `gateway_reference` | text | Bank UTR / reference |
| `status` | text | `INITIATED`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `initiated_by` | bigint FK → users | Finance user |
| `initiated_at`, `completed_at` | timestamptz | |
| `failure_reason` | text | |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (amount > 0)
CHECK (status IN ('INITIATED','PROCESSING','COMPLETED','FAILED'))
CREATE INDEX payout_by_org ON vendor_payout (organization_id, initiated_at DESC);
```

**Why the rename:** "payment history" reads as the **buyer's** payments, and sooner or later someone joins it to the wrong table. "Vendor payout" says what it is.

## 9.4 `vendor_payout_item` *(renamed from `payment_earning_link`)*

| Column | Type | Meaning |
|---|---|---|
| `payout_id` | bigint FK | |
| `earning_id` | bigint FK | |
| `amount` | `d_money` | Settlement currency |

**Rules**
```sql
PRIMARY KEY (payout_id, earning_id)
CREATE INDEX payout_item_by_earning ON vendor_payout_item (earning_id);
```

**Why:** one bank transfer usually covers many earnings, and this table shows exactly which ones. An earning is paid **in full** by one payout. If that payout fails, its earnings go back to `PAYABLE` and are picked up by a new payout. The payout run locks each earning row, so two runs can't pay the same earning.

---

# PART 10 — Notifications 🆕 *(G-03)*

Every message the platform sends to a person: order accepted, quote received, document expiring, payout completed. Document 3 WF-5 requires reminders that are deduplicated, sent as digests, and **logged so the platform can prove a vendor was notified**. v2 had no table for any of it.

## 10.1 `notification`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `recipient_user_id` | bigint FK, nullable | A specific person |
| `recipient_org_id` | bigint FK, nullable | A whole vendor company (every user with the relevant permission sees it) |
| `type` | text | `ORDER_PLACED`, `ORDER_ACCEPTED`, `QUOTE_RECEIVED`, `DOC_EXPIRING`, `DOC_DIGEST`, `PAYOUT_COMPLETED` … |
| `title` | text | |
| `body` | text | |
| `payload` | jsonb | Data for the screen or template (order number, amounts, link) |
| `entity_type`, `entity_id` | text, bigint | What it is about |
| `dedupe_key` | text UNIQUE | Makes sending safe to repeat |
| `created_at` | timestamptz | |
| `read_at` | timestamptz | |

**Rules**
```sql
CHECK (num_nonnulls(recipient_user_id, recipient_org_id) = 1)
CREATE INDEX notif_unread_user ON notification (recipient_user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX notif_unread_org  ON notification (recipient_org_id,  created_at DESC) WHERE read_at IS NULL;
```

**The `dedupe_key` does all the duplicate work:**

| Situation | dedupe_key | Result |
|---|---|---|
| Order #101 accepted | `order-accepted:101` | Sent once, however many times the job retries |
| 20 documents missing for Sharma Traders today | `doc-digest:org:5:2026-09-25` | **One** digest, not 20 emails |
| Halal certificate expiring, 30-day reminder | `doc-expiry:812:30d` | Once at 30 days, once at 15, once at 7 — never twice at the same step |

## 10.2 `notification_delivery`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `notification_id` | bigint FK | |
| `channel` | text | `EMAIL`, `SMS`, `WHATSAPP`, `IN_APP` |
| `destination_masked` | text | `r***@sharmatraders.com` |
| `provider` | text | `SES`, `TWILIO` … |
| `provider_message_id` | text | For matching delivery callbacks |
| `status` | text | `QUEUED`, `SENT`, `DELIVERED`, `FAILED`, `BOUNCED` |
| `attempt` | smallint | Retry count |
| `error` | text | |
| `queued_at`, `sent_at`, `delivered_at` | timestamptz | |

**Rules**
```sql
CHECK (channel IN ('EMAIL','SMS','WHATSAPP','IN_APP'))
CHECK (status IN ('QUEUED','SENT','DELIVERED','FAILED','BOUNCED'))
CREATE INDEX delivery_queue ON notification_delivery (queued_at) WHERE status = 'QUEUED';
CREATE UNIQUE INDEX delivery_provider_id ON notification_delivery (provider, provider_message_id)
  WHERE provider_message_id IS NOT NULL;
```

**Why two tables:** one notification can go out on several channels, each with its own delivery status, and the delivery row is the **proof** Document 3 asks for: "the vendor was emailed on 12 Sept at 09:14 and the email was delivered."

---

# PART 11 — Compliance, Trust and Content

## 11.0 How the compliance tables fit together

```
compliance_rule_set (version 7, PUBLISHED)
   └── compliance_rule  "SPICES, IN → US"
          └── rule_requirement  FDA_REG (mandatory), LAB_REPORT (optional)
                                   │
   product + destination ──resolve──▶ requirement_resolution  (what is required, pinned to version 7)
                                   │
   vendor uploads ────────────────▶ vendor_document  (version 1, 2 … one is current)
                                   │
   admin check ───────────────────▶ document_review (stage ADMIN)
   bank round trip ───────────────▶ bank_pack ─▶ bank_pack_item ─▶ document_review (stage BANK)
```

These tables come from Document 3's sketch, made concrete. **Two dimensions still wait on the client:** whether one product can have several destinations (Document 3 Q1; this model already supports it) and the list of trade types (Q2; `trade_type` stays nullable until then).

## 11.1 `document_type`

| Column | Type | Meaning |
|---|---|---|
| `code` | text PK | `IEC`, `GST_REG`, `FDA_REG`, `HALAL_CERT`, `PHYTOSANITARY`, `COO` |
| `name` | text | |
| `description` | text | |
| `issuing_authority` | text | |
| `scope` | text | `VENDOR` (uploaded once, reused by every product) or `PRODUCT` |
| `requires_expiry` | boolean | |
| `requires_number` | boolean | |
| `allowed_mime_types` | text[] | `{application/pdf, image/jpeg}` |
| `max_size_mb` | smallint | |
| `is_active` | boolean | |

**Rules:** `CHECK (scope IN ('VENDOR','PRODUCT'))`

## 11.2 `compliance_rule_set`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `version` | int UNIQUE | 1, 2, 3 … |
| `status` | text | `DRAFT`, `PUBLISHED`, `RETIRED` |
| `effective_from` | date | |
| `effective_to` | date, nullable | |
| `published_by` | bigint FK → users | |
| `published_at` | timestamptz | |
| `created_at` | timestamptz | |

**Rules**
```sql
CHECK (status IN ('DRAFT','PUBLISHED','RETIRED'))
ALTER TABLE compliance_rule_set ADD CONSTRAINT one_published_per_period
  EXCLUDE USING gist ((daterange(effective_from, effective_to, '[)')) WITH &&) WHERE (status = 'PUBLISHED');
```
Plus one trigger: once a set is `PUBLISHED`, its rules and requirements can't be changed. The next change is a new version *(Document 3 CM-4)*.

## 11.3 `compliance_rule`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `rule_set_id` | bigint FK | |
| `product_scope` | text | `PRODUCT`, `HS_PATTERN`, `CATEGORY`, `ANY` |
| `product_id` | bigint FK, nullable | For `PRODUCT` |
| `hs_pattern` | text, nullable | For `HS_PATTERN`, e.g. `0910%` |
| `category_id` | bigint FK, nullable | For `CATEGORY` |
| `source_country` | `d_country` FK, **nullable = any** | |
| `destination_country` | `d_country` FK, **nullable = any** | |
| `trade_type` | text, **nullable = any** | Values wait on Document 3 Q2 |
| `specificity_score` | smallint, generated | Higher = more specific; wins ties |
| `notes` | text | |
| `created_at` | timestamptz | |

**Rules** *(H-29)*
```sql
CHECK (product_scope IN ('PRODUCT','HS_PATTERN','CATEGORY','ANY'))
CHECK ((product_scope = 'PRODUCT')    = (product_id  IS NOT NULL))
CHECK ((product_scope = 'HS_PATTERN') = (hs_pattern  IS NOT NULL))
CHECK ((product_scope = 'CATEGORY')   = (category_id IS NOT NULL))
ALTER TABLE compliance_rule ADD COLUMN specificity_score smallint GENERATED ALWAYS AS (
    CASE product_scope WHEN 'PRODUCT' THEN 3 WHEN 'HS_PATTERN' THEN 2 WHEN 'CATEGORY' THEN 1 ELSE 0 END
  + (source_country IS NOT NULL)::int + (destination_country IS NOT NULL)::int + (trade_type IS NOT NULL)::int
) STORED;
CREATE INDEX rule_lookup ON compliance_rule (rule_set_id, destination_country, source_country);
```

**Why:** "any country" is stored as **NULL**, not the text `'ANY'` from Document 3's sketch. NULL can sit in a column with a foreign key to `country`; `'ANY'` can't, and invites `'Any'` and `'any '`. The specificity score is computed by the database, so the rule-precedence logic (CM-2) never drifts from the data.

## 11.4 `rule_requirement` 🆕 *(H-29)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `rule_id` | bigint FK | |
| `document_type_code` | text FK → document_type | |
| `is_mandatory` | boolean | Per document, not per rule |
| `notes` | text | |

**Rules:** `UNIQUE (rule_id, document_type_code)`

**Why:** Document 3 CM-6 says each **requirement** declares mandatory or optional, but the sketch put `mandatory` on the whole rule. One rule can require FDA registration (mandatory) **and** a lab report (optional), and only a join table can say that.

## 11.5 `requirement_resolution`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `product_id` | bigint | |
| `organization_id` | bigint | |
| `destination_country` | `d_country` FK | |
| `rule_set_id` | bigint FK | The version the answer is pinned to |
| `required_documents` | jsonb | `[{"code":"FDA_REG","mandatory":true,"rule_id":41}, …]` |
| `is_current` | boolean | False once a newer rule set re-resolves it |
| `resolved_at` | timestamptz | |

**Rules**
```sql
FOREIGN KEY (product_id, organization_id) REFERENCES product (id, organization_id)
UNIQUE (product_id, destination_country, rule_set_id)
CREATE UNIQUE INDEX resolution_current ON requirement_resolution (product_id, destination_country) WHERE is_current;
```

**Why:** the resolved list is **stored**, not recalculated, so a past approval can be proven against the rules of its day *(Document 3 CM-4)*. It is JSONB because it is read and shown as one checklist; each document's live status comes from joining `vendor_document`. When a new rule set is published, every affected product is re-resolved, and newly missing documents raise notifications *(CM-7)*.

## 11.6 `vendor_document`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `organization_id` | bigint FK | |
| `product_id` | bigint FK, **nullable** | Empty = vendor-level (IEC, GST), reused by every product |
| `destination_country` | `d_country`, nullable | Empty = valid for all destinations |
| `document_type_code` | text FK | |
| `version` | int | |
| `supersedes_id` | bigint FK → vendor_document, nullable | |
| `is_current` | boolean | The version in use |
| `storage_key` | text | |
| `sha256` | `d_sha256` | *(H-30)* |
| `document_number` | text | Certificate number |
| `issued_on`, `expires_on` | date | |
| `status` | text | `UPLOADED`, `PENDING_ADMIN_CHECK`, `RETURNED_FOR_CORRECTION`, `PENDING_BANK_REVIEW`, `WITH_BANK`, `APPROVED`, `REJECTED`, `EXPIRED` |
| `uploaded_by` | bigint FK → users | |
| `uploaded_at`, `updated_at` | timestamptz | |

**Rules** *(H-30)*
```sql
CHECK (status IN ('UPLOADED','PENDING_ADMIN_CHECK','RETURNED_FOR_CORRECTION','PENDING_BANK_REVIEW',
                  'WITH_BANK','APPROVED','REJECTED','EXPIRED'))
UNIQUE NULLS NOT DISTINCT (organization_id, document_type_code, product_id, destination_country, version)
CREATE UNIQUE INDEX vdoc_one_current ON vendor_document
  (organization_id, document_type_code, coalesce(product_id, 0), coalesce(destination_country, '--'))
  WHERE is_current;
CREATE INDEX vdoc_expiring ON vendor_document (expires_on) WHERE is_current AND status = 'APPROVED';
```

**Why**
- **"REQUIRED" is not a stored status.** A document is "required" when the resolution lists it and no current row exists. Storing it would mean creating empty rows and keeping them in step with the rules.
- **Re-upload = new version.** The old row gets `is_current = false`, and nothing is overwritten.
- **The reminder scan** ("every approved document expiring in 60/30/15/7 days, for every vendor") is one indexed range read. That query is the reason this is a table, not a JSON checklist per vendor.
- Whether an expired certificate unpublishes the product automatically is Document 3 Q9. The model supports both answers.

## 11.7 `document_review` *(append-only)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `vendor_document_id` | bigint FK | |
| `stage` | text | `ADMIN`, `BANK` |
| `outcome` | text | `APPROVED`, `REJECTED`, `RETURNED_FOR_CORRECTION` |
| `reviewer_user_id` | bigint FK → users, nullable | The admin (ADMIN stage) or the admin recording the bank result |
| `bank_pack_id` | bigint FK, nullable | Required for BANK stage — the provenance lives there |
| `comments` | text | Required unless approved |
| `reviewed_at` | timestamptz | |

**Rules**
```sql
CHECK (stage IN ('ADMIN','BANK'))
CHECK (outcome IN ('APPROVED','REJECTED','RETURNED_FOR_CORRECTION'))
CHECK (stage <> 'BANK' OR bank_pack_id IS NOT NULL)
CHECK (outcome = 'APPROVED' OR coalesce(btrim(comments),'') <> '')
CREATE INDEX review_by_doc ON document_review (vendor_document_id, reviewed_at);
```

**Why:** the bank stage is a first-class stage now, not an admin action, so if the bank later logs in directly (Document 3 §5.3), the history is the same shape.

## 11.8 `bank_pack` 🆕 *(G-04)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `pack_ref` | text UNIQUE | Printed on the cover sheet |
| `organization_id` | bigint FK | The vendor submission |
| `status` | text | `GENERATED`, `WITH_BANK`, `RETURNED`, `RECORDED`, `CANCELLED` |
| `generated_by` | bigint FK → users | |
| `generated_at` | timestamptz | |
| `pack_storage_key` | text | The merged PDF we produced |
| `pack_sha256` | `d_sha256` | |
| `sent_at` | timestamptz | Admin took it to the bank |
| `bank_name`, `bank_branch` | text | Provenance (mandatory once returned) |
| `bank_officer_name`, `bank_officer_designation` | text | |
| `bank_reference_number` | text | |
| `endorsed_on` | date | |
| `endorsed_storage_key` | text | The file the bank endorsed |
| `endorsed_sha256` | `d_sha256` | Stored once, immutable |
| `recorded_by` | bigint FK → users | Admin who uploaded the result |
| `recorded_at` | timestamptz | |
| `countersigned_by` | bigint FK → users, nullable | Second admin, for high-value packs |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (status IN ('GENERATED','WITH_BANK','RETURNED','RECORDED','CANCELLED'))
CHECK (status NOT IN ('RETURNED','RECORDED') OR (
        bank_name IS NOT NULL AND bank_branch IS NOT NULL AND bank_officer_name IS NOT NULL AND
        bank_officer_designation IS NOT NULL AND bank_reference_number IS NOT NULL AND
        endorsed_on IS NOT NULL AND endorsed_storage_key IS NOT NULL AND endorsed_sha256 IS NOT NULL))
CHECK (countersigned_by IS NULL OR countersigned_by <> recorded_by)
CREATE INDEX bank_pack_open ON bank_pack (status, sent_at) WHERE status IN ('GENERATED','WITH_BANK','RETURNED');
```

**Why:** Document 3 §5 lists the provenance that must be captured on every bank round trip, and the sketch had nowhere to put it. Now the database refuses to record a bank result without it, the endorsed file's hash is stored once, and a countersignature can't be the recorder signing twice. The `bank_pack_open` index serves the admin's "With bank — N days" queue and the follow-up reminder.

## 11.9 `bank_pack_item` 🆕

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `bank_pack_id` | bigint FK | |
| `vendor_document_id` | bigint FK | |
| `outcome` | text, nullable | Filled when the result is recorded |
| `comments` | text | |

**Rules**
```sql
UNIQUE (bank_pack_id, vendor_document_id)
CHECK (outcome IS NULL OR outcome IN ('APPROVED','REJECTED','RETURNED_FOR_CORRECTION'))
```

**Why:** every document's bank outcome traces back to **one pack and one bank visit**. Recording the pack writes one `document_review` (stage BANK) per item in the same transaction.

## 11.10 `vendor_badge`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `organization_id` | bigint FK | |
| `badge_type` | text | `VERIFIED_EXPORTER`, `TRADE_ASSURANCE`, `KYC_VERIFIED`, `TOP_RATED` |
| `status` | text | `ACTIVE`, `EXPIRED`, `REVOKED` |
| `granted_by` | bigint FK → users | Always an admin — never automatic, never self-declared |
| `granted_at`, `expires_at` | timestamptz | |
| `revoked_by` | bigint FK → users | |
| `revoked_at` | timestamptz | |
| `revoke_reason` | text | |

**Rules** *(H-31)*
```sql
CHECK (badge_type IN ('VERIFIED_EXPORTER','TRADE_ASSURANCE','KYC_VERIFIED','TOP_RATED'))
CHECK (status IN ('ACTIVE','EXPIRED','REVOKED'))
CHECK (status <> 'REVOKED' OR coalesce(btrim(revoke_reason),'') <> '')
CREATE UNIQUE INDEX badge_one_active ON vendor_badge (organization_id, badge_type) WHERE status = 'ACTIVE';
```

**Note:** `TOP_RATED` needs rating data, which only exists if `vendor_review` (Part 14) is built *(Q-07)*. Until then admins should not grant it.

## 11.11 `compliance_alert`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `alert_type` | text | `RULE_CHANGED`, `CERT_EXPIRING`, `PRODUCT_RESTRICTED`, `COUNTRY_BLOCKED` |
| `country_code` | `d_country` FK | |
| `product_id` | bigint FK, nullable | |
| `organization_id` | bigint FK, nullable | |
| `title`, `message` | text | |
| `severity` | text | `INFO`, `WARNING`, `CRITICAL` |
| `is_buyer_visible` | boolean | |
| `valid_from`, `valid_until` | date | |
| `created_by` | bigint FK → users | |
| `created_at` | timestamptz | |

**Rules**
```sql
CHECK (alert_type IN ('RULE_CHANGED','CERT_EXPIRING','PRODUCT_RESTRICTED','COUNTRY_BLOCKED'))
CHECK (severity IN ('INFO','WARNING','CRITICAL'))
CREATE INDEX alert_active ON compliance_alert (country_code, valid_until);
```

**Why:** the alert is the **announcement**. Telling each affected vendor is done by `notification` rows (one per vendor, deduplicated), so there's one delivery mechanism and one proof trail for everything.

## 11.12 `hs_code_suggestion_log`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `user_id` | bigint FK | |
| `search_text` | text | "turmeric powder" |
| `suggested_codes` | jsonb | What was offered |
| `selected_code` | char(6) FK → hs_code, nullable | |
| `was_helpful` | boolean | |
| `created_at` | timestamptz | |

**Rules:** logged **once per completed search** (when a code is picked or the box is left), never per keystroke. Rows older than 12 months are deleted *(H-31)*.

**Why:** written per keystroke, this would become the largest table on the platform while holding the least value.

## 11.13 `featured_export_product`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `list_year` | smallint | 2026 |
| `rank` | smallint | 1 … 20 |
| `product_name` | text | `Basmati Rice` |
| `category_id` | bigint FK | |
| `hs_code` | char(6) FK | |
| `demand_score` | numeric(6,2) | |
| `top_destination_countries` | jsonb | `["US","AE","GB"]` — display only |
| `growth_percent` | numeric(6,2) | |
| `data_source` | text | |
| `is_published` | boolean | |
| `created_at`, `updated_at` | timestamptz | |

**Rules:** `UNIQUE (list_year, rank)`, `CHECK (rank BETWEEN 1 AND 100)`

## 11.14 `content` 🆕 *(G-10)*

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `content_type` | text | `VIDEO`, `DOCUMENT`, `PAGE`, `PARTNER` |
| `title` | text | |
| `slug` | text UNIQUE | |
| `summary` | text | |
| `body` | text | Rich text |
| `media` | jsonb | `{"youtube_id":"…"}` · `{"storage_key":"…"}` · `{"logo_key":"…","url":"…"}` |
| `audience` | text | `PUBLIC`, `VENDOR`, `BUYER` |
| `status` | text | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `sort_order` | int | |
| `published_at` | timestamptz | |
| `created_by` | bigint FK → users | |
| `created_at`, `updated_at` | timestamptz | |

**Rules**
```sql
CHECK (content_type IN ('VIDEO','DOCUMENT','PAGE','PARTNER'))
CHECK (audience IN ('PUBLIC','VENDOR','BUYER'))
CHECK (status IN ('DRAFT','PUBLISHED','ARCHIVED'))
CREATE INDEX content_listing ON content (content_type, audience, sort_order) WHERE status = 'PUBLISHED';
```

**Why:** Document 3 §9 asks for videos, platform documents, product pages and partner logos. The fields per type differ and are always rendered whole, so one table with a JSONB `media` column beats four near-identical tables. Videos are embedded by YouTube id, never hosted. Whether this content sits behind login is Document 3 Q11; `audience` supports either answer.

---

# PART 12 — End-to-End Flows

Each flow lists its **transactions**. A transaction is all-or-nothing: if any step fails, every step in it is undone. `T1`, `T2`… are separate transactions, and between them the system is always in a valid state.

## 12.1 Vendor registration — Rahul creates Sharma Traders

```
T1  (one transaction)
    organization               status = PENDING, requires_second_approver = true
    organization_status_history  NULL → PENDING
    users                      user_type = VENDOR, organization_id = <new org>, status = PENDING,
                               password_hash = argon2id(password typed on the form)
    user_role                  VENDOR_OWNER
    user_token                 EMAIL_VERIFY
    notification               "Verify your email" (dedupe: verify:<user_id>)

T2  Rahul clicks the email link
    user_token.used_at         atomic single-use update (2.7)
    users                      email_verified = true, status = ACTIVE

T3… Rahul declares corridor and uploads company documents
    vendor_target_country, vendor_document (vendor-level: IEC, GST) — see 12.10

T4  Admin approves the company
    organization               status = APPROVED, approved_by, approved_at   (guarded: WHERE status = 'PENDING')
    organization_status_history  PENDING → APPROVED
    audit_log                  vendor.approve
    notification               "Your company is approved"
```

**Rahul is the Owner because** T1 wrote `user_role = VENDOR_OWNER` for him. There is no owner column anywhere.

## 12.2 Buyer registration — John signs up

```
T1  users                      user_type = BUYER, organization_id = NULL, status = PENDING
    buyer_profile              country, preferred_currency
    user_role                  BUYER
    user_token                 EMAIL_VERIFY
    (Google sign-up instead: user_social_account, email_verified = true, status = ACTIVE, no token)
    If a visitor cart exists: its lines merge into John's new cart; visitor cart → MERGED

T2  Email verified → status = ACTIVE. No admin approval.
```

## 12.3 Adding a teammate — Rahul adds Mohan as Maker

```
T1  (Rahul needs permission user.manage)
    users                      organization_id = Rahul's org, user_type = VENDOR, status = PENDING,
                               password_hash = NULL
    user_role                  VENDOR_MAKER
    user_token                 INVITE (48 h)
    audit_log                  user.invite
    notification               invite email

T2  Mohan opens the link, sets his own password
    user_token.used_at, users.password_hash, users.status = ACTIVE, email_verified = true
```
Nobody ever types, sees or emails Mohan's password except Mohan.

## 12.4 Cart → checkout → payment → orders

John buys 600 kg turmeric from Sharma Spices and 300 m cotton from Gupta Textiles.

```
ADD TO CART  (one transaction per click)
    check  product PUBLISHED, product_target_country allowed for cart.destination_country,
           quantity >= moq, tier found for quantity
    cart_item  insert or update; last_shown_price = tier price converted to cart currency

T1  START CHECKOUT
    re-check every cart line (price, stock, MOQ, country) — lines that fail are shown greyed, Pay blocked
    exchange_rate               latest row for (cart.currency → base) — its id is locked
    checkout_session            source_type = CART, exchange_rate_id, fx_rate, expires_at = now() + 30 min
    shipping_rate_quote         one set of options PER VENDOR (Sharma, Gupta)

T2  ADDRESS AND SHIPPING
    checkout_session.shipping_address / billing_address = JSON copies of the chosen buyer_address rows
    shipping_rate_quote.is_selected — one per vendor
    totals computed and stored on checkout_session

T3  PAY CLICKED   ← stock is reserved here, before any money moves (M-04)
    for each line:  atomic UPDATE inventory … WHERE quantity_available >= qty   (4.1)
                    stock_reservation   HELD, expires_at = checkout_session.expires_at
                    stock_movement      RESERVED
    any line returns 0 rows → the WHOLE transaction rolls back → "Only 150 kg left"
    payment                     INITIATED, idempotency_key from the browser
    checkout_session            status = PAYMENT_PENDING
    → buyer is sent to the gateway

T4  GATEWAY WEBHOOK ARRIVES   (inbox pattern, 8.2)
    payment_transaction         insert (duplicate gateway_event_id → stops here, nothing else happens)

T5  WORKER PROCESSES THE MESSAGE   (one transaction)
    payment                     forward-only UPDATE → CAPTURED    (0 rows → already done, stop)
    order_group                 1 row, total 4,200 USD, fx locked
    orders                      #101 Sharma, #102 Gupta — each with shipping_address, billing_address,
                                vendor_snapshot, three currencies, status = PENDING
    order_item                  snapshots of name, SKU, HS, price
    order_status_history        NULL → PENDING for each order
    stock_reservation           HELD → CONVERTED, order_id set
    payment.order_group_id      set
    cart                        status = CONVERTED, converted_order_group_id
    checkout_session            status = COMPLETED
    payment_transaction.processed_at
    notification                buyer receipt; "New order" to each vendor

FAILURE PATHS
    payment FAILED / CANCELLED   → reservations RELEASED, inventory given back, stock_movement RELEASED,
                                   checkout_session FAILED; cart stays ACTIVE so the buyer can retry
    buyer abandons at gateway    → sweeper (every minute) finds HELD reservations past expires_at:
                                   same release, reservations EXPIRED, checkout_session EXPIRED
    capture arrives AFTER expiry → stock may be gone. Worker re-reserves; if that fails, the orders
                                   are still created but marked for vendor confirmation, or refunded
                                   automatically (client decision — default: automatic refund)
```

## 12.5 Vendor accepts, rejects, ships, delivers

```
ACCEPT   orders PENDING → ACCEPTED (guarded)          order_status_history
         notification to buyer

REJECT   (one transaction)
         orders PENDING → REJECTED (guarded, reason required)
         order_status_history
         stock_reservation CONVERTED → RELEASED; inventory available +q, reserved −q; stock_movement RELEASED
         refund INITIATED for this order's total, reason = VENDOR_REJECTED
         payment row locked; amount_refunded += refund.amount   (CHECK refuses over-refund)
         notification to buyer
         → gateway refund call happens after commit; its result updates refund.status

SHIP     shipment BOOKED, awb / tracking number
         orders → SHIPPED
         stock_reservation CONVERTED → CONSUMED; inventory reserved −q; stock_movement SALE_OUT
         order_document COMMERCIAL_INVOICE, PACKING_LIST (version 1)

TRACK    carrier webhooks → shipment.tracking_events, shipment.status → orders IN_TRANSIT

DELIVER  shipment DELIVERED → orders DELIVERED, delivered_at
         vendor_earning EARNING row, status = PENDING
         commission from commission_rule (most specific, valid on order date)
         after the holding period (default 7 days, no open dispute) → status = PAYABLE
```

## 12.6 RFQ → quotation → accept → pay

```
T1  rfq                       buyer creates, audience = OPEN
    rfq_recipient             matching job adds eligible vendors (category + delivery_country)
    notification              one per recipient vendor

T2  quotation                 vendor sends, status = SENT
    rfq                       OPEN → QUOTED
    rfq_message               thread (rfq_id, vendor_org_id) — only that vendor and the buyer see it

    Vendor revises price      old quotation → SUPERSEDED, new row revision + 1

T3  BUYER CLICKS CHOOSE   (one transaction)
    SELECT … FROM rfq WHERE id = :rfq FOR UPDATE           -- one Choose at a time per RFQ
    check quotation.status = 'SENT' AND valid_until >= today
    quotation (chosen)        → ACCEPTED   (unique index blocks a second winner)
    quotation (others, SENT)  → REJECTED
    rfq                       → ACCEPTED
    checkout_session          source_type = QUOTATION, priced at the quoted amount
    notification              winner and losing vendors

T4… Same as 12.4 from T2 onward: address, shipping, pay, capture → order_group + ONE order
    with quotation_id set (unique: one order per quote). Stock is reserved only if the product
    has an inventory row; made-to-order RFQ goods skip reservation.
```

## 12.7 Product lifecycle

```
CREATE      product DRAFT + tiers + media + target countries (one transaction per save)
SUBMIT      DRAFT → PENDING_CHECKER — refused unless: first tier min = moq, no tier gaps,
            at least one allowed country, one primary image
CHECK       guarded update, approver ≠ creator (3.1)   product_approval_log CHECKER
ADMIN       PENDING_ADMIN → APPROVED                   product_approval_log ADMIN
PUBLISH     APPROVED → PUBLISHED, published_at         requires organization.status = APPROVED
            and every mandatory document for each allowed destination APPROVED

EDIT LIVE   status stays PUBLISHED
            pending_changes = diff, pending_status = PENDING_CHECKER
            … Checker (approver ≠ pending_submitted_by) … Admin …
            APPLY (one transaction): copy diff onto columns, row_version + 1,
            product_approval_log (EDIT, changes_snapshot), clear pending_*
            Price edits don't touch existing orders (snapshots) or open checkouts (locked quote);
            carts see the new price on next view with a "price changed" banner.
```

## 12.8 Refund after the vendor was already paid

```
refund COMPLETED for order #101 (after payout)
    vendor_earning   new row REFUND_ADJUSTMENT, negative net_amount_settlement, related_refund_id,
                     status = PAYABLE
    The next payout run nets it: payable balance = SUM(net_amount_settlement) over PAYABLE rows.
    If the balance is negative, no payout is made and the balance carries forward.
```

## 12.9 Payout run (Finance)

```
T1  (per vendor)
    check  vendor_bank_account: primary, ACTIVE, VERIFIED — otherwise skip and notify the vendor
    SELECT … FROM vendor_earning WHERE organization_id = :org AND status = 'PAYABLE'
       FOR UPDATE SKIP LOCKED                  -- two runs can never take the same earning
    balance = SUM(net_amount_settlement)  — must be > 0
    vendor_payout       INITIATED, bank_account_id, amount = balance
    vendor_payout_item  one row per earning
    vendor_earning      status stays PAYABLE until confirmed (only status/paid_at may change)

T2  Bank confirms (UTR received)
    vendor_payout COMPLETED, gateway_reference
    vendor_earning (its items) → PAID, paid_at
    notification  "Payout of ₹1,99,800 sent to •••• 4821"

    Bank fails → vendor_payout FAILED, failure_reason; earnings stay PAYABLE for the next run
```

## 12.10 Compliance: documents → admin → bank → publish

```
RESOLVE     product saved with destinations → requirement_resolution per (product, destination),
            pinned to the current PUBLISHED rule set
UPLOAD      vendor_document version n, is_current = true (previous current → false), sha256
SUBMIT      documents → PENDING_ADMIN_CHECK
ADMIN CHECK document_review (ADMIN): APPROVED → PENDING_BANK_REVIEW, or RETURNED_FOR_CORRECTION
BANK PACK   bank_pack GENERATED + bank_pack_item per document; documents → WITH_BANK
            admin takes the PDF to the bank → bank_pack WITH_BANK, sent_at
RECORD      (one transaction) bank_pack RETURNED → RECORDED with all provenance fields (CHECK enforced),
            endorsed file + sha256; per item: outcome, document_review (BANK), vendor_document status
            all mandatory approved → vendor VERIFIED badge may be granted; products eligible to publish
EXPIRY      daily scan (vdoc_expiring index): notifications at 60/30/15/7 days (dedupe per step);
            on the day: vendor_document → EXPIRED, product flagged (auto-unpublish = Document 3 Q9)
RULES CHANGE new rule set PUBLISHED → affected products re-resolved; newly required documents
            raise one digest notification per vendor
```

## 12.11 Scheduled jobs

| Job | Frequency | Reads (index) | Writes |
|---|---|---|---|
| Reservation / checkout sweeper | every minute | `reservation_sweeper`, `checkout_sweeper` | release stock, EXPIRED |
| Payment inbox worker | continuous | `ptx_unprocessed` | 12.4 T5 |
| Notification sender | continuous | `delivery_queue` | delivery status |
| Exchange-rate fetch | hourly | — | `exchange_rate` insert |
| Quotation expiry | daily | `quote_expiry` | EXPIRED |
| RFQ expiry | daily | `rfq_open_match` | EXPIRED |
| Low-stock scan | daily | `inventory` | `stock_alert`, notification |
| Document expiry reminders | daily | `vdoc_expiring` | notification, EXPIRED |
| Bank-pack follow-up | daily | `bank_pack_open` | admin notification |
| Earnings release (hold period) | daily | `earning_payable` | PENDING → PAYABLE |
| Abandoned carts | daily | `cart_abandon_scan` | ABANDONED |
| Token / suggestion-log cleanup | nightly | — | delete expired tokens, logs > 12 months |
| Reservation integrity check | nightly | — | alert if `quantity_reserved` ≠ SUM(HELD + CONVERTED) |

---

# PART 13 — Security, Performance and Operations

## 13.1 Row-level security, table by table

| Policy | Tables |
|---|---|
| **Vendor-owned** — `organization_id = app.org_id` | `vendor_target_country`, `vendor_bank_account`, `product`, `product_target_country`, `product_price_tier`, `product_media`, `product_approval_log`, `inventory`, `stock_reservation`, `stock_movement`, `stock_alert`, `quotation`, `vendor_earning`, `vendor_payout`, `vendor_document`, `requirement_resolution`, `bank_pack`* |
| **Buyer-owned** — `user_id = app.user_id` | `buyer_profile`, `buyer_address`, `cart`, `wishlist`, `checkout_session`, `payment`, `buyer_payment_method` |
| **Two-sided** — buyer OR vendor on the row | `orders` (`buyer_user_id` / `vendor_org_id`), `order_item`, `order_status_history`, `shipment`, `order_document` (buyer sees only `is_buyer_visible`), `refund`, `rfq` (buyer, or a vendor with an `rfq_recipient` row), `rfq_recipient`, `rfq_message` (buyer, or the thread's vendor) |
| **Public read** (published only), admin write | `product` (buyers read PUBLISHED), `category`, `hs_code`, `country`, `currency`, `exchange_rate`, `vendor_badge`, `compliance_alert` (buyer-visible), `featured_export_product`, `content` |
| **Platform only** | `audit_log`, `organization_status_history`, `commission_rule`, `bank_pack_item`, `document_review`*, `payment_transaction`, `auth_session` (own rows for users) |

\* Vendors see their own `bank_pack` status and their documents' review outcomes and comments, not the bank officer's personal details.

The `product` table has two policies: owners see all their rows; everyone else sees `status = 'PUBLISHED'` only.

## 13.2 Permissions on history and money columns

```sql
REVOKE UPDATE, DELETE ON organization_status_history, audit_log, product_approval_log,
  stock_movement, order_status_history, document_review, exchange_rate FROM app_rw;

REVOKE UPDATE, DELETE ON payment_transaction, order_document, rfq_message, vendor_earning FROM app_rw;
GRANT UPDATE (payment_id, processed_at)      ON payment_transaction TO app_rw;
GRANT UPDATE (is_buyer_visible)              ON order_document      TO app_rw;
GRANT UPDATE (read_at)                       ON rfq_message         TO app_rw;
GRANT UPDATE (status, paid_at, updated_at)   ON vendor_earning      TO app_rw;

REVOKE DELETE ON ALL TABLES IN SCHEMA public FROM app_rw;
GRANT  DELETE ON user_token, hs_code_suggestion_log TO app_rw;   -- the only purgeable tables
```

## 13.3 Hot-path indexes (summary)

| Screen / job | Index |
|---|---|
| Product listing by category | `product_listing (category_id, published_at DESC) WHERE PUBLISHED` |
| Product search | `product_search_gin`, `product_name_trgm` |
| "Deliverable to my country" filter | `ptc_buyer_filter (target_country, product_id) WHERE is_allowed` |
| Tier price lookup | `tier_no_overlap` (the GiST index behind it) |
| Vendor orders board | `orders_vendor_board (vendor_org_id, status, placed_at DESC)` |
| Buyer "My orders" | `orders_buyer_list (buyer_user_id, placed_at DESC)` |
| Vendor RFQ inbox | `rfq_recipient_inbox (vendor_org_id, created_at DESC)` |
| Latest FX rate | `exchange_rate_latest (from, to, fetched_at DESC)` |
| Expiring documents | `vdoc_expiring (expires_on) WHERE current AND APPROVED` |
| Payable earnings | `earning_payable (organization_id, status, earned_at)` |
| Login | `users_email_uq (lower(email))` |

Plus an index on every foreign key (0.10).

## 13.4 Caching

| Cached in the application | Refreshed when |
|---|---|
| `category` tree, `hs_code`, `country`, `currency`, `unit` / Incoterm lists | admin edits |
| Latest exchange rates | hourly job |
| Each user's resolved permission set | at login; cleared when an admin edits roles or permissions |

Never cached: stock, prices on checkout, payment state.

## 13.5 Growth plan

| Stage | Trigger | Action |
|---|---|---|
| Launch | — | One Postgres primary + point-in-time backups. Dashboards computed live from indexed queries |
| Reports slow the app | Reporting queries show up in the primary's slow-query log | Add a **read replica**; analytics and exports read there with `app_ro` |
| Log tables large | `audit_log`, `stock_movement`, `payment_transaction`, `order_status_history`, `notification_delivery` pass ~20 M rows | **Monthly partitioning** by `created_at`; old partitions to cheaper storage |
| Search strains Postgres | Search p95 > 300 ms at peak | Add Meilisearch / Elasticsearch fed from `product` changes; Postgres stays the source of truth |
| Dashboards slow | Dashboard query p95 > 500 ms | Hourly summary table per vendor per day |

Nothing in this list is built before its trigger is seen. The expected volumes (client question Q-08) tell us roughly when each will arrive.

## 13.6 Retention

| Data | Kept for |
|---|---|
| Orders, invoices, payments, refunds, earnings, payouts, compliance documents, bank packs | At least 8 years (Indian GST and customs record-keeping; client's legal team to confirm per country) |
| Audit and status history | Same as the records they describe |
| Notifications and deliveries | 2 years |
| `hs_code_suggestion_log` | 12 months |
| Expired tokens | 30 days after expiry |
| Abandoned carts | 12 months, then archived |
| Personal data after an erasure request | Anonymised immediately (0.8) |

## 13.7 Backups

Continuous WAL archiving with point-in-time recovery (at least 14 days), a daily full snapshot copied to a second region, and a **restore drill every quarter**. A backup that has never been restored is not a backup.

---

# PART 14 — Pending Tables (built only after the client decides)

## 14.1 `inventory_lot` `[PENDING Q-03]`

For food exports that need batch traceability and per-batch expiry.

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `product_id`, `organization_id` | bigint | Composite FK to product |
| `lot_number` | text | |
| `manufactured_on`, `expires_on` | date | |
| `quantity_available`, `quantity_reserved` | `d_qty` | |
| `status` | text | `ACTIVE`, `EXPIRED`, `RECALLED`, `EXHAUSTED` |
| `created_at`, `updated_at` | timestamptz | |

Rules: `UNIQUE (product_id, lot_number)`. `inventory` becomes the sum across lots, and `stock_reservation` and `order_item` gain `lot_id`.

## 14.2 `vendor_review` `[PENDING Q-07]`

| Column | Type | Meaning |
|---|---|---|
| `id` | bigint PK | |
| `order_id` | bigint FK UNIQUE | One review per delivered order — stops fake reviews |
| `buyer_user_id` | bigint FK | |
| `organization_id` | bigint FK | |
| `rating` | smallint | 1–5 |
| `review_text` | text | |
| `status` | text | `PENDING`, `PUBLISHED`, `HIDDEN` |
| `created_at` | timestamptz | |

Rules: `CHECK (rating BETWEEN 1 AND 5)`. It can only be written for an order with status `DELIVERED`. It feeds the `TOP_RATED` badge.

## 14.3 `organization_member` `[PENDING Q-02]`

Only if one person must work for **two** vendor companies.

| Column | Type | Meaning |
|---|---|---|
| `user_id` | bigint FK | |
| `organization_id` | bigint FK | |
| `status` | text | `INVITED`, `ACTIVE`, `REMOVED` |
| `joined_at` | timestamptz | |

Rules: `PRIMARY KEY (user_id, organization_id)`. When built, `users.organization_id` is dropped, `user_role` gains `organization_id` back (with `UNIQUE NULLS NOT DISTINCT (user_id, role_id, organization_id)`), and the person picks a company at login, which sets `app.org_id`.

---

# PART 15 — Complete Table List

| # | Table | Part | Owner | Kind |
|---|---|---|---|---|
| 1 | `currency` | 1 | Platform | Reference |
| 2 | `country` 🆕 | 1 | Platform | Reference |
| 3 | `exchange_rate` | 1 | Platform | Append-only |
| 4 | `category` | 1 | Platform | Reference |
| 5 | `hs_code` | 1 | Platform | Reference |
| 6 | `organization` | 2 | — | Core |
| 7 | `organization_status_history` 🆕 | 2 | Organization | Append-only |
| 8 | `vendor_target_country` | 2 | Organization | Core |
| 9 | `vendor_bank_account` 🆕 | 2 | Organization | Core, encrypted |
| 10 | `users` (was `user`) | 2 | Org or none | Core |
| 11 | `auth_session` 🆕 | 2 | User | Security |
| 12 | `user_token` | 2 | User | Security, purgeable |
| 13 | `user_social_account` | 2 | User | Security |
| 14 | `buyer_profile` | 2 | Buyer | Core |
| 15 | `buyer_address` | 2 | Buyer | Core |
| 16 | `role` | 2 | Platform | Reference |
| 17 | `permission` | 2 | Platform | Reference |
| 18 | `role_permission` | 2 | Platform | Reference |
| 19 | `user_role` | 2 | User | Core |
| 20 | `audit_log` 🆕 | 2 | Platform | Append-only |
| 21 | `product` | 3 | Organization | Core |
| 22 | `product_target_country` | 3 | Organization | Core |
| 23 | `product_price_tier` | 3 | Organization | Core |
| 24 | `product_media` | 3 | Organization | Core |
| 25 | `product_approval_log` | 3 | Organization | Append-only |
| 26 | `inventory` | 4 | Organization | Hot |
| 27 | `stock_reservation` 🆕 | 4 | Organization | Hot |
| 28 | `stock_movement` | 4 | Organization | Append-only |
| 29 | `stock_alert` | 4 | Organization | Core |
| 30 | `rfq` | 5 | Buyer | Core |
| 31 | `rfq_recipient` 🆕 | 5 | Both | Core |
| 32 | `quotation` | 5 | Organization | Core |
| 33 | `rfq_message` | 5 | Both | Insert-only |
| 34 | `cart` | 6 | Buyer | Short-lived |
| 35 | `cart_item` | 6 | Buyer | Short-lived |
| 36 | `wishlist` | 6 | Buyer | Core |
| 37 | `checkout_session` | 6 | Buyer | Short-lived |
| 38 | `shipping_rate_quote` | 6 | Buyer | Short-lived |
| 39 | `order_group` 🆕 | 7 | Buyer | Core |
| 40 | `orders` (was `order`) | 7 | Both | Legal record |
| 41 | `order_item` | 7 | Both | Legal record |
| 42 | `order_status_history` | 7 | Both | Append-only |
| 43 | `shipment` 🆕 | 7 | Both | Core |
| 44 | `order_document` | 7 | Both | Versioned, immutable |
| 45 | `payment` | 8 | Buyer | Money |
| 46 | `payment_transaction` | 8 | Platform | Append-only inbox |
| 47 | `refund` | 8 | Both | Money |
| 48 | `buyer_payment_method` | 8 | Buyer | Tokens only |
| 49 | `commission_rule` 🆕 | 9 | Platform | Reference |
| 50 | `vendor_earning` | 9 | Organization | Ledger |
| 51 | `vendor_payout` (was `payment_history`) | 9 | Organization | Money |
| 52 | `vendor_payout_item` (was `payment_earning_link`) | 9 | Organization | Money |
| 53 | `notification` 🆕 | 10 | User / Org | Core |
| 54 | `notification_delivery` 🆕 | 10 | Platform | Proof log |
| 55 | `document_type` | 11 | Platform | Reference |
| 56 | `compliance_rule_set` | 11 | Platform | Versioned |
| 57 | `compliance_rule` | 11 | Platform | Versioned |
| 58 | `rule_requirement` 🆕 | 11 | Platform | Versioned |
| 59 | `requirement_resolution` | 11 | Organization | Pinned snapshot |
| 60 | `vendor_document` | 11 | Organization | Versioned |
| 61 | `document_review` | 11 | Platform | Append-only |
| 62 | `bank_pack` 🆕 | 11 | Organization | Provenance |
| 63 | `bank_pack_item` 🆕 | 11 | Platform | Provenance |
| 64 | `vendor_badge` | 11 | Organization | Core |
| 65 | `compliance_alert` | 11 | Platform | Core |
| 66 | `hs_code_suggestion_log` | 11 | User | Log, purgeable |
| 67 | `featured_export_product` | 11 | Platform | Editorial |
| 68 | `content` 🆕 | 11 | Platform | Editorial |
| — | `inventory_lot` | 14 | Organization | Pending Q-03 |
| — | `vendor_review` | 14 | Both | Pending Q-07 |
| — | `organization_member` | 14 | Both | Pending Q-02 |

**68 tables to build, 3 pending.** Rows 55–57 and 59–61 were sketched in Document 3 and are now concrete, so they are not marked new.

---

# PART 16 — Relationship Map

```
                                   country ── currency ── exchange_rate
                                      │
 PLATFORM org ─ users(admin)          │
                                      ▼
 organization(VENDOR) ─┬─ users(vendor) ── user_role ── role ── role_permission ── permission
                       ├─ vendor_target_country ◀── product_target_country
                       ├─ vendor_bank_account ◀── vendor_payout ── vendor_payout_item ── vendor_earning
                       ├─ product ─┬─ product_price_tier                                     ▲
                       │           ├─ product_media                                          │
                       │           ├─ product_approval_log                                   │
                       │           ├─ inventory ── stock_reservation ── stock_movement       │
                       │           └─ requirement_resolution                                 │
                       ├─ vendor_document ── document_review ── bank_pack ── bank_pack_item  │
                       ├─ quotation ◀── rfq_recipient ── rfq ◀── users(buyer)                │
                       │                  └─ rfq_message                                     │
                       └─ vendor_badge                                                        │
                                                                                              │
 users(buyer) ─┬─ buyer_profile, buyer_address, wishlist, buyer_payment_method                │
               ├─ cart ── cart_item                                                           │
               └─ checkout_session (cart OR quotation) ── shipping_rate_quote (per vendor)    │
                        │                                                                     │
                        ├─ payment ── payment_transaction                                     │
                        │     └─ refund ─────────────────────────────┐                        │
                        ▼                                            ▼                        │
                  order_group ────────────────▶ orders (per vendor) ─┴─ order_item            │
                                                    ├─ order_status_history                   │
                                                    ├─ shipment                               │
                                                    ├─ order_document                         │
                                                    └──────────────────────────────────────── ┘
                                                                  (earning per delivered order)

 notification ── notification_delivery        audit_log, organization_status_history (everything)
```

The same model, as interactive diagrams, is in the **Marketplace Data Model** artifact. It shows the v2 shape; Parts 2–11 here are authoritative.

---

# PART 17 — Review Traceability

Every finding from the schema review, and where this document fixes it.

| ID | Finding | Fixed in |
|---|---|---|
| M-01 | Reserved words `user`, `order` | 0.2, 2.5, 7.2 |
| M-02 | Maker ≠ Checker at the wrong level | 2.12, 3.1, 2.1 (`requires_second_approver`) |
| M-03 | Editing a live product took it offline | 3.1 (`pending_changes`), 12.7 |
| M-04 | Stock reserved after payment | 4.1, 4.2, 12.4 T3 |
| M-05 | Order address was a live link | 6.4, 7.2 |
| M-06 | RFQ messages leaked between vendors | 5.4 |
| M-07 | One payment, many orders, single FK | 7.1, 7.2, 8.1, 6.1 |
| M-08 | Shipping quoted once per checkout | 6.5 |
| M-09 | RFQ orders couldn't be paid | 6.4, 12.6 |
| M-10 | Earnings summed across currencies | 7.2, 9.2 |
| G-01 | `country` | 1.2 |
| G-02 | `vendor_bank_account` | 2.4, 9.3 |
| G-03 | `notification`, `notification_delivery` | 10 |
| G-04 | `bank_pack`, `bank_pack_item` | 11.8, 11.9 |
| G-05 | `shipment` | 7.5 |
| G-06 | `organization_status_history`, `audit_log` | 2.2, 2.13 |
| G-07 | `auth_session` | 2.6 |
| G-08 | `rfq_recipient` | 5.1, 5.2 |
| G-09 | `commission_rule` | 9.1 |
| G-10 | `content` | 11.14 |
| H-01 | Status CHECK lists | 0.5, every table |
| H-02 | Code types, FKs, rate precision | 0.3, 1.1–1.3 |
| H-03 | Decimal quantities, unit list | 0.3 |
| H-04 | bigint keys + public ids | 0.4 |
| H-05 | Index every FK | 0.10 |
| H-06 | One tenant-column name | 0.2 |
| H-07 | RLS on child tables | 0.11, 13.1 |
| H-08 | Append-only enforced by grants | 0.7, 13.2 |
| H-09 | Erasure vs never-delete; encryption | 0.8, 0.9 |
| H-10 | Lost-update guard | 0.12 |
| H-11 | Case-insensitive email | 2.5 |
| H-12 | Duplicate org id; role uniqueness | 2.11, 2.12 |
| H-13 | Login hardening | 2.5, 2.7, 2.8 |
| H-14 | 1:1 PK; composite tenant FKs | 2.9, 3.1–3.4, 4.1 |
| H-15 | Tier overlap constraint; tier currency | 3.3 |
| H-16 | Product countries ⊂ vendor countries | 2.3, 3.2 |
| H-17 | National tariff codes; HS version | 1.5, 3.2 |
| H-18 | Search indexes | 3.1 |
| H-19 | Media storage key | 3.4 |
| H-20 | Movement log balances | 4.3 |
| H-21 | One open stock alert | 4.4 |
| H-22 | Incoterms; tax breakdown | 0.3, 5.3, 7.2 |
| H-23 | Order indexes; guarded status | 7.2 |
| H-24 | One accepted quote, one order | 5.3, 7.2 |
| H-25 | Stored cart totals removed | 6.1, 6.2 |
| H-26 | Idempotency; forward-only status | 8.1, 8.2 |
| H-27 | Earnings ledger; payout renames | 9.2–9.4 |
| H-28 | FX history; single base currency | 1.1, 1.3 |
| H-29 | ANY = NULL; `rule_requirement` | 11.3, 11.4 |
| H-30 | Document current flag, hash, expiry index | 11.6 |
| H-31 | Suggestion-log volume; unique badges and ranks | 11.10, 11.12, 11.13 |

---

# PART 18 — Client Decisions: Defaults Taken

The model is buildable today. Each open question has a default, and the table shows what changes if the client answers differently.

| # | Question | Default in this document | If the client says otherwise |
|---|---|---|---|
| Q-01 | Can a one-person vendor approve their own products? | Per company: `requires_second_approver = true` by default; admin review always follows | Flip the default to `false` — no schema change |
| Q-02 | One person, two vendor companies? Can a vendor also buy? | One company per person; a vendor can buy by holding the `BUYER` role | Build `organization_member` (14.3) |
| Q-03 | Batch / lot tracking with expiry? | No lots; `product.expiry_date` removed | Build `inventory_lot` (14.1) |
| Q-04 | Multi-language product content? | Optional `name_i18n` / `description_i18n` columns exist, unused | Start filling them — no schema change |
| Q-05 | Partial acceptance or shipment of an order? | Whole order only; `shipment` already allows several per order | Add `order_item.status`; refunds per line |
| Q-06 | Cart before sign-up? | Supported (`anonymous_token_hash`) | Leave the column unused |
| Q-07 | Reviews and ratings? | Not built; `TOP_RATED` not granted | Build `vendor_review` (14.2) |
| Q-08 | Expected volumes? | Single primary; growth plan in 13.5 | Changes the timing, not the schema |
| Q-09 | Multi-vendor cart? | Supported via `order_group` | `order_group` stays — RFQ checkouts use it too |
| Doc 3 Q1 | One product, many destinations? | Supported (per-destination resolution and documents) | Restrict to one row per product |
| Doc 3 Q2 | Trade-type values? | `trade_type` nullable = any | Add the CHECK list once known |
| Doc 3 Q9 | Auto-unpublish on expired certificate? | Flag only | Expiry job also sets `DELISTED` |
| — | Holding period before an earning is payable | 7 days after delivery | Config value |
| — | Capture arrives after the stock hold expired | Automatic refund | Hold for vendor confirmation instead |

---

*End of Document 6 (Version 3). Supersedes `04_Data_Modeling.md` and `05_Data_Modeling_Buyer.md` for build purposes. Related: `01_Business_Requirements_Document.md`, `02_Technical_Architecture_Document.md`, `03_Vendor_Onboarding_and_Compliance_Workflows.md`.*
