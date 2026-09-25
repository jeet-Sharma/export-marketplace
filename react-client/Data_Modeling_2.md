# Export Marketplace Platform
## Document 4 — Data Modeling (Simple Guide)
 
| Field | Value |
|---|---|
| Project | Export Marketplace Platform |
| Covers | Registration (Platform Admin / Vendor / Buyer) + Vendor Portal: Dashboard, Products, Orders, Inventory, RFQ, Analytics, Documents, Profile |
| Not covered here | Full buyer portal, logistics-provider portal, external storage/provider details |
| Version | 2 — updated 20 September 2026 |
| Written for | Developers and the client — plain language, no heavy technical terms |
 
> **What changed in Version 2:** the buyer is now a **normal public user**, not a company. Only vendors have an Organization. See Part A.1.
 
---
 
## How to read this document
 
A **table** is like one Excel sheet. Each table stores one kind of thing — one sheet for companies, one sheet for products, one sheet for orders.
 
A **column** is one box of information in that sheet, like "name" or "price".
 
A **row** is one record — one company, one product, one order.
 
A **relation** means two sheets are joined together. Example: a product row says "I belong to company number 5".
 
**FK** means *Foreign Key*. It is just a link to another table.
 
---
 
# PART A — Registration (Platform Admin, Vendor, Buyer)
 
## A.1 The structure — read this first
 
There are **three kinds of people** in this system, and they are **not** built the same way.
 
```
┌─────────────────────────────────────────────────────────────────┐
│                          PLATFORM                                │
│                  (owned by our client)                           │
│                                                                  │
│   Super Admin                                                    │
│   Admin / Operations Manager / Finance Manager / Support         │
│                                                                  │
│   → They run the whole system.                                   │
│   → They approve vendors and publish products.                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │  manages
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ORGANIZATION  =  VENDOR COMPANY             │
│                                                                  │
│   Example: "Sharma Spices Pvt Ltd"                               │
│                                                                  │
│   One Organization can have MANY vendor users inside it:         │
│        • Ramesh  → Maker   (adds products)                       │
│        • Suresh  → Checker (approves products)                   │
│        • Priya   → Owner   (sees everything)                     │
│                                                                  │
│   The Organization owns:  products, stock, orders, earnings      │
└─────────────────────────────────────────────────────────────────┘
 
┌─────────────────────────────────────────────────────────────────┐
│                            BUYER                                 │
│                                                                  │
│   A normal public user. Anyone can sign up.                      │
│   NO company. NO organization. Just one person with a login.     │
│                                                                  │
│   Example: John from USA signs up, browses, buys.                │
└─────────────────────────────────────────────────────────────────┘
```
 
### The three types side by side
 
| | Platform Admin | Vendor | Buyer |
|---|---|---|---|
| Belongs to a company? | Yes — the platform itself | **Yes — an Organization** | **No** |
| How do they join? | Created by Super Admin | Registers, then **admin approves** | **Signs up freely, starts using immediately** |
| Can many people share one account group? | Yes | **Yes — many users in one Organization** | **No — one person, one account** |
| Needs approval? | No | **Yes** | **No** |
| What do they own? | Nothing personally | Products, stock, orders, earnings | Their own orders and RFQs |
 
### The one sentence to remember
 
> **Organization = vendor company.**
> Platform admins sit above it. Buyers sit completely outside it.
 
---
 
## A.2 Table: `organization` — the vendor company
 
One row = one vendor company. Plus **one single row** for the platform itself.
 
**Buyers do NOT get a row here.**
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number for this company |
| `org_type` | text | `PLATFORM` (only one row — our client) or `VENDOR` |
| `legal_name` | text | Official registered company name |
| `display_name` | text | Short name shown on screen |
| `email` | text | Main company email |
| `phone` | text | Main company phone |
| `website` | text (can be empty) | Company website shown in the vendor profile |
| `founded_year` | number (can be empty) | Year the vendor company started |
| `employee_count_range` | text (can be empty) | Example: `120-150` |
| `tax_registration_number` | text (can be empty) | GSTIN / VAT / Tax registration number |
| `import_export_code` | text (can be empty) | IEC or local export registration code |
| `source_country` | text | Country the goods come **from**. Example: `IN` |
| `source_currency` | text | Currency of that country. Example: `INR` |
| `address_line1` | text | Address |
| `address_line2` | text | Address |
| `city` | text | City |
| `state` | text | State |
| `postal_code` | text | PIN / ZIP code |
| `country` | text | Country of the company office |
| `status` | text | `PENDING` = waiting for admin, `APPROVED` = can sell, `SUSPENDED`, `BLOCKED` |
| `approved_by` | number (FK → user) | Which admin approved this vendor |
| `approved_at` | date+time | When it was approved |
| `created_at` | date+time | When the company registered |
| `updated_at` | date+time | Last change |
 
**Easy explanation:**
 
`status` is the most important column. A new vendor starts as `PENDING`. They **cannot sell anything**. An admin checks their papers and changes it to `APPROVED`. Only then can their products go live.
 
There is exactly **one** row with `org_type = PLATFORM`. That represents our client's own company, and all admin staff belong to it.

**Important database rules:**

- Add a unique rule so only one row can have `org_type = PLATFORM`.
- `legal_name` should be unique for active vendor organizations in the same country.
- `tax_registration_number` and `import_export_code` should be unique per country when present.
- The profile UI shows initials and "Verified Supplier"; those should be derived from `display_name`, `status`, and verified documents, not stored as separate permanent columns.

---
 
## A.3 Table: `vendor_target_country` — where the vendor wants to sell
 
A vendor sells **from one country** but **to many countries**. One row per destination country.
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `organization_id` | number (FK → organization) | Which vendor |
| `target_country` | text | Country they want to sell to. Example: `US` |
| `target_currency` | text | Currency for that country. Example: `USD` |
| `is_active` | yes/no | Are they currently selling there |
| `created_at` | date+time | When added |
| `updated_at` | date+time | Last change |
 
**Easy explanation:**
Sharma Spices is in India (`source_country = IN`) and wants to sell to USA and UAE. So this table gets **2 rows** for them — one for `US`, one for `AE`.
 
Why a separate table instead of one column? Because one company can have many target countries, and you cannot put many values in one box.

**Important database rules:**

- Add a unique rule on `organization_id + target_country`.
- Only vendor organizations can have rows here. The platform organization must not have target-country rows.

---
 
## A.4 Table: `user` — every person who logs in
 
**All three types** — admin, vendor and buyer — live in this **one** table. What makes them different is `user_type` and whether they have an `organization_id`.
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number for this person |
| `user_type` | text | `PLATFORM`, `VENDOR`, or `BUYER` |
| `organization_id` | number (FK → organization, **can be empty**) | Which company. **Always empty for a BUYER** |
| `full_name` | text | Person's name |
| `email` | text (unique) | Login email — no two users can have the same |
| `phone` | text | Mobile number |
| `password_hash` | text | Password stored in scrambled form. **Never store the real password** |
| `auth_provider` | text | `LOCAL` = made a password here, `GOOGLE` = logged in using Google |
| `email_verified` | yes/no | Did they click the verification link |
| `status` | text | `PENDING`, `ACTIVE`, `BLOCKED` |
| `last_login_at` | date+time | When they last logged in |
| `created_at` | date+time | When the account was made |
| `updated_at` | date+time | Last change |
 
### How `organization_id` works for each type
 
| user_type | organization_id | Example |
|---|---|---|
| `PLATFORM` | Points to the **platform** organization row | Admin Anita |
| `VENDOR` | Points to their **vendor company** row | Ramesh at Sharma Spices |
| `BUYER` | **Empty (NULL)** | John from USA |
 
**Easy explanation:**
 
This is the key rule. When you load a user, you first look at `user_type`:
 
- `PLATFORM` → show the admin panel
- `VENDOR` → show the vendor panel, and load everything for their `organization_id`
- `BUYER` → show the buyer panel, and load everything for their own `user_id`
 
**Important:** the company has a `status` and the person has a `status`. They are different. The company can be `APPROVED` but you can still `BLOCK` one employee who left the job.

**Database note:** `user` is used in this document because it is easy to read. In PostgreSQL, use a safer physical table name like `app_user` or `users`.

**Important database rules:**

- If `user_type = BUYER`, `organization_id` must be empty.
- If `user_type = VENDOR`, `organization_id` must point to a vendor organization.
- If `user_type = PLATFORM`, `organization_id` must point to the single platform organization.
- Store emails in a case-insensitive unique way, so `A@x.com` and `a@x.com` cannot create two accounts.

---
 
## A.5 Table: `buyer_profile` — extra details for a buyer
 
A buyer has no company, so their details cannot sit in `organization`. They go here instead.
 
One row per buyer user.
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `user_id` | number (FK → user) | Which buyer |
| `buyer_type` | text | `INDIVIDUAL` or `BUSINESS` — see note below |
| `company_name` | text (can be empty) | Only if they are buying for a business |
| `country` | text | Buyer's country. Example: `US` |
| `preferred_currency` | text | Currency they want to see prices in. Example: `USD` |
| `preferred_language` | text | Language |
| `tax_id` | text (can be empty) | VAT / Tax number, if a business |
| `is_verified` | yes/no | Has the buyer been verified (optional extra trust) |
| `created_at`, `updated_at` | date+time | Timestamps |
 
**Note on `buyer_type`:**
A buyer signs up as a normal person. If they later say "I am buying for my company", you just set `buyer_type = BUSINESS` and fill in `company_name` and `tax_id`. **You do not create an Organization for them.** Organizations are only for vendors.
 
---
 
## A.6 Table: `buyer_address` — buyer's delivery addresses
 
A buyer can save several addresses — home, office, warehouse.
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `user_id` | number (FK → user) | Which buyer |
| `label` | text | `Home`, `Office`, `Warehouse` |
| `contact_name` | text | Who receives the goods |
| `contact_phone` | text | Their phone |
| `address_line1` | text | Address |
| `address_line2` | text | Address |
| `city` | text | City |
| `state` | text | State |
| `postal_code` | text | ZIP / PIN |
| `country` | text | Country |
| `is_default` | yes/no | Use this one automatically at checkout |
| `created_at`, `updated_at` | date+time | Timestamps |
 
**Easy explanation:** this is the same idea as a saved address list on any shopping website.
 
---
 
## A.7 Table: `role` — the job name
 
One row = one job title. You create these once at the start.
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `code` | text | Short code used in the system |
| `name` | text | Name shown on screen |
| `scope_type` | text | `PLATFORM`, `VENDOR`, or `BUYER` |
| `is_system` | yes/no | `yes` = built-in role, admin cannot delete it |
| `description` | text | What this job does |
 
**Starting rows in this table:**
 
| code | name | scope_type | Who gets it |
|---|---|---|---|
| `SUPER_ADMIN` | Super Admin | PLATFORM | Our client's owner |
| `ADMIN` | Admin | PLATFORM | Client's staff |
| `OPS_MANAGER` | Operations Manager | PLATFORM | Client's staff |
| `FINANCE_MANAGER` | Finance Manager | PLATFORM | Client's staff |
| `SUPPORT` | Support Team | PLATFORM | Client's staff |
| `VENDOR_OWNER` | Vendor - Owner | VENDOR | The vendor company's boss |
| `VENDOR_MAKER` | Vendor - Maker | VENDOR | Adds products |
| `VENDOR_CHECKER` | Vendor - Checker | VENDOR | Approves products |
| `VENDOR_LOGISTICS` | Vendor - Logistics | VENDOR | Manages shipping and export documents |
| `BUYER` | Buyer | BUYER | Every buyer, automatically |
 
**Easy explanation:**
The role by itself does nothing. It is only a name tag. The real power comes from `permission` below.
 
**About the buyer role:** every buyer gets the same `BUYER` role automatically at signup. There is no approval and no choice. That is why buyer registration is so much simpler than vendor registration.
 
---
 
## A.8 Table: `permission` — one single action
 
One row = one thing a person can do.
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `code` | text | The action code |
| `module` | text | Which part of the system |
| `description` | text | Plain explanation |
 
**Example rows:**
 
| code | module | description |
|---|---|---|
| `product.create` | Products | Add a new product |
| `product.edit` | Products | Change a product |
| `product.approve` | Products | Approve a product (Checker) |
| `product.publish` | Products | Make it live (Admin only) |
| `order.view` | Orders | See orders |
| `order.accept` | Orders | Accept an order |
| `order.reject` | Orders | Reject an order |
| `order.update_status` | Orders | Change order status |
| `order.place` | Orders | Place an order (Buyer) |
| `inventory.manage` | Inventory | Change stock |
| `rfq.create` | RFQ | Raise a request (Buyer) |
| `rfq.view` | RFQ | See buyer requests |
| `rfq.quote` | RFQ | Send a quotation |
| `analytics.view` | Analytics | See reports |
| `document.view` | Documents | View export documents |
| `document.upload` | Documents | Upload or replace export documents |
| `shipping.manage` | Shipping | Manage shipment preparation and logistics updates |
| `vendor.approve` | Admin | Approve a vendor company |
| `user.manage` | Admin | Add or remove users |
 
---
 
## A.9 Table: `role_permission` — which job can do which action
 
This joins `role` and `permission`.
 
| Column | Type | Simple meaning |
|---|---|---|
| `role_id` | number (FK → role) | The job |
| `permission_id` | number (FK → permission) | The action |
 
**Example:**
 
```
VENDOR_MAKER    →  product.create, product.edit, inventory.manage,
                   rfq.view, rfq.quote, order.view
 
VENDOR_CHECKER  →  product.approve, order.view, order.accept,
                   order.reject, order.update_status, analytics.view
 
BUYER           →  order.place, order.view, rfq.create
 
SUPER_ADMIN     →  everything
```
 
**Why this matters (very important):**
 
In your code, never write:
 
```
if (user.role == "VENDOR_CHECKER")     ❌ wrong
```
 
Always write:
 
```
if (user.can("product.approve"))       ✅ correct
```
 
**Reason:** our client wants the admin to change what each role can do, from the admin screen, without calling a developer. If you check the role name in code, every small change needs a new code release. If you check the permission, the admin ticks a box and it works immediately.
 
---
 
## A.10 Table: `user_role` — which person has which job
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `user_id` | number (FK → user) | The person |
| `role_id` | number (FK → role) | The job |
| `organization_id` | number (FK → organization, **can be empty**) | Where this job applies. **Empty for buyers** |
| `assigned_by` | number (FK → user) | Who gave this job |
| `assigned_at` | date+time | When |
 
**Easy explanation:**
Why a separate table? Because **one person can have more than one job**. Just add two rows.
 
But remember one rule: for Maker-Checker to work properly, **the same person should not be both Maker and Checker**. The system must block that at the time of saving.

**Important database rules:**

- Add a unique rule on `user_id + role_id + organization_id`.
- For vendor roles, `user_role.organization_id` must match the user's vendor organization.
- For buyer roles, `user_role.organization_id` must be empty.

---
 
## A.11 Full example — how it all fits together
 
```
── PLATFORM (our client) ─────────────────────────────────────────
 
organization
  id=1, org_type=PLATFORM, legal_name="Export Marketplace Pvt Ltd"
 
user
  id=99, user_type=PLATFORM, organization_id=1, name="Anita"
user_role
  user_id=99 → SUPER_ADMIN
 
 
── VENDOR COMPANY ────────────────────────────────────────────────
 
organization
  id=5, org_type=VENDOR, legal_name="Sharma Spices Pvt Ltd",
        source_country=IN, source_currency=INR, status=APPROVED
 
vendor_target_country
  organization_id=5 → US / USD
  organization_id=5 → AE / AED
 
user
  id=11, user_type=VENDOR, organization_id=5, name="Ramesh"
  id=12, user_type=VENDOR, organization_id=5, name="Suresh"
  id=13, user_type=VENDOR, organization_id=5, name="Priya"
 
user_role
  user_id=11 → VENDOR_MAKER    (org 5)
  user_id=12 → VENDOR_CHECKER  (org 5)
  user_id=13 → VENDOR_OWNER    (org 5)
 
  ← THREE people, ONE company. All their products, stock and
    orders belong to organization_id = 5.
 
 
── BUYER ─────────────────────────────────────────────────────────
 
user
  id=501, user_type=BUYER, organization_id=NULL, name="John Smith"
 
buyer_profile
  user_id=501, buyer_type=INDIVIDUAL, country=US,
               preferred_currency=USD
 
buyer_address
  user_id=501, label="Office", city="New York", country=US,
               is_default=yes
 
user_role
  user_id=501 → BUYER   (organization_id = NULL)
 
  ← ONE person, NO company. His orders belong to user_id = 501.
```
 
---
 
## A.12 The two golden rules of data separation
 
Because vendors and buyers are built differently, they are protected differently.
 
### Rule 1 — Vendor data is separated by `organization_id`
 
> Every vendor-owned table has an `organization_id` column, and **every query must filter by it**.
 
Vendor tables: `product`, `inventory`, `stock_movement`, `order` (vendor side), `vendor_earning`, `quotation`, `vendor_document`.
 
If you forget this even once, Sharma Spices will see another vendor's orders. This is the most dangerous bug in a marketplace.
 
### Rule 2 — Buyer data is separated by `user_id`
 
> Every buyer-owned table has a `user_id` column, and **every query must filter by it**.
 
Buyer tables: `buyer_profile`, `buyer_address`, `order` (buyer side), `rfq`.
 
A buyer has no organization, so their own user id is their boundary.
 
**Extra safety:** add row-level security in PostgreSQL as a second layer, so even a mistake in the code cannot leak data.
 
---
 
## A.13 Registration flows — side by side
 
```
VENDOR REGISTRATION (slow, needs approval)
────────────────────────────────────────────
1. Vendor fills company form
2. Create ORGANIZATION row    → status = PENDING
3. Create USER row            → user_type = VENDOR, status = PENDING
4. Give role VENDOR_OWNER
5. Vendor uploads documents (GST, IEC, certificates)
6. ADMIN reviews
7. Admin approves             → organization.status = APPROVED
8. Now the vendor can add products
9. Owner can add more users (Maker, Checker) inside the same company
 
 
BUYER REGISTRATION (fast, no approval)
────────────────────────────────────────────
1. Buyer fills a short signup form (or clicks Google login)
2. Create USER row            → user_type = BUYER,
                                 organization_id = NULL
3. Create BUYER_PROFILE row   → country, currency
4. Give role BUYER
5. Verify email
6. Done — they can browse and buy immediately
   (No organization. No admin approval.)
 
 
ADMIN CREATION (manual, by Super Admin only)
────────────────────────────────────────────
1. Super Admin opens User Management
2. Creates USER row           → user_type = PLATFORM,
                                 organization_id = 1 (the platform)
3. Gives a role (ADMIN / OPS / FINANCE / SUPPORT)
4. System emails an invite link
   (Admins never self-register.)
```
 
---
 
# PART B — Products
 
This covers the **Products** menu in the vendor panel. Products belong to an **Organization**, not to a person.
 
## B.1 Table: `category` — product groups
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `parent_id` | number (FK → category, can be empty) | Parent group, for sub-categories |
| `name` | text | Example: `Spices`, `Textiles`, `Handicrafts` |
| `slug` | text | URL-friendly name |
| `is_active` | yes/no | Show it or not |
| `sort_order` | number | Display order |
 
**Easy explanation:** `parent_id` lets you make a tree — Spices → Whole Spices → Turmeric.
 
---
 
## B.2 Table: `hs_code` — international product code
 
HS Code is a worldwide number used to classify goods for customs. Example: `0910.30` = Turmeric.
 
| Column | Type | Simple meaning |
|---|---|---|
| `code` | text | The HS number |
| `description` | text | What goods it covers |
| `chapter` | text | Top-level group |
| `is_active` | yes/no | Still valid |
 
**Easy explanation:** this is a **master list** you load once. Vendors pick from it — they must not type it freely, or customs documents will be wrong.
 
---
 
## B.3 Table: `product` — the main product record
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `organization_id` | number (FK → organization) | **Which vendor company owns it** |
| `name` | text | Product name |
| `description` | text | Full description |
| `category_id` | number (FK → category) | Which group |
| `hs_code` | text (FK → hs_code) | Customs code |
| `sku` | text | Vendor's own item code |
| `base_price` | decimal | Price for one unit |
| `base_currency` | text | Currency of that price |
| `moq` | number | Minimum Order Quantity — smallest quantity a buyer can order |
| `unit` | text | `KG`, `PIECE`, `BOX`, `TON` |
| `weight_kg` | decimal | Weight of one unit — needed for shipping cost |
| `length_cm`, `width_cm`, `height_cm` | decimal | Size — needed for shipping cost |
| `expiry_date` | date (can be empty) | For food items |
| `status` | text | See the list below |
| `created_by` | number (FK → user) | Maker who created it |
| `created_at`, `updated_at` | date+time | Timestamps |
 
**Note:** the product belongs to the **company** (`organization_id`), not to the person who made it. If Ramesh leaves the job, the product stays with Sharma Spices. `created_by` only records who typed it in.
 
**Status values — this is the Maker-Checker flow:**
 
| Status | Meaning |
|---|---|
| `DRAFT` | Maker is still writing it. Nobody else sees it |
| `PENDING_CHECKER` | Maker submitted. Waiting for the vendor's Checker |
| `PENDING_ADMIN` | Checker approved. Waiting for platform Admin |
| `APPROVED` | Admin approved. Ready to go live |
| `PUBLISHED` | Live on the website, buyers can see it |
| `REJECTED` | Someone rejected it. Maker must fix it |
| `DELISTED` | Removed from the website |
 
```
  Maker creates  →  DRAFT
        │ submits
        ▼
  PENDING_CHECKER  ──rejected──▶ REJECTED ──fix──▶ back to DRAFT
        │ Checker approves          (inside vendor company)
        ▼
  PENDING_ADMIN    ──rejected──▶ REJECTED
        │ Admin approves           (platform side)
        ▼
     APPROVED  →  PUBLISHED  →  (later)  DELISTED
```
 
Notice the two levels: the **Checker** is inside the vendor company; the **Admin** is on the platform side. Two different organizations, two different approvals.
 
---
 
## B.4 Table: `product_target_country` — which countries this product can be sold to
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `product_id` | number (FK → product) | Which product |
| `target_country` | text | Destination country |
| `target_currency` | text | Currency for that country |
| `is_allowed` | yes/no | Is selling allowed there |
| `block_reason` | text | If not allowed, why |
 
**Easy explanation:** the vendor may sell to USA and UAE overall, but one particular product may only be allowed in UAE. This table stores that, product by product.
 
### B.4.1 The rule: a product's countries must come from the vendor's own list
 
This table does **not** let a product go anywhere. It can only ever be a **smaller slice** of `vendor_target_country` (see A.3). A product must never reach a country the vendor company itself is not approved for.
 
```
vendor_target_country (organization = Sharma Spices)
      US ✓        AE ✓        SG ✓
      │           │           │
      │           │           └── product can say "no" to this one
      ▼           ▼           ▼
product_target_country (product = Turmeric Powder)
      US ✓        AE ✓        SG ✗  (blocked, with a reason)
```
 
**Example rows for Turmeric Powder (`product_id = 101`):**
 
| id | product_id | target_country | is_allowed | block_reason |
|---|---|---|---|---|
| 1 | 101 | US | yes | |
| 2 | 101 | AE | yes | |
| 3 | 101 | SG | **no** | "Import ban on spice powder over 500g pack" |
 
Reading this: Sharma Spices sells to 3 countries in general, but this specific product is blocked from Singapore, and the reason is on file for Admin to review.
 
**Why `block_reason` matters:** when `is_allowed = no`, the reason is not optional decoration — Admin sees it during product approval (same Checker → Admin flow as B.3), and it is what a buyer support agent or customs check will point to later if someone in Singapore asks "why can't I buy this?". Treat a `no` row with an empty `block_reason` as bad data.
 
### B.4.2 How to handle this in the UI
 
Show this as a checklist inside the product form (same idea as the price-tier and media sections) — **not** a free country picker:
 
```
 Target Countries for this product
 ──────────────────────────────────
 ☑ United States (USD)
 ☑ United Arab Emirates (AED)
 ☐ Singapore (SGD)
      └─ Reason not available here (required):
         [ Import ban on spice powder over 500g pack        ]
 
 ⚠ Product must be available in at least 1 country.
```
 
- Only list the countries from that vendor's own `vendor_target_country` (where `is_active = yes`) — never all world countries. This stops a bad row from ever being created in the first place.
- Default every box to **checked**. The Maker only unchecks the exceptions.
- Unchecking a box reveals the `block_reason` field. Make it **required** — don't allow saving `is_allowed = no` with a blank reason.
- Block save if every box is unchecked — a product with nowhere to sell should never reach `PENDING_CHECKER`.
- On save: one `product_target_country` row per vendor target country, `is_allowed` set from the checkbox, `block_reason` cleared automatically if the box is re-checked later.
- Where buyers/admin see the result afterwards, show it as short chips, e.g. `Available in: 🇺🇸 🇦🇪 · Not available in: 🇸🇬 (import ban)`.
 
**Edge case — the vendor's own country list changes later:**
 
| Event | What to do to `product_target_country` |
|---|---|
| Admin/vendor adds a new target country to the company | Do **not** auto-mark existing products as allowed there. Create the row as `is_allowed = no` by default and let the vendor opt in — never silently start exporting something nobody checked. |
| A target country is removed from the company | Cascade-deactivate the matching `product_target_country` rows so no product can stay "allowed" for a country the vendor itself is no longer approved for. |
 
---
 
## B.5 Table: `product_price_tier` — bulk pricing
 
Buy more, pay less per unit.
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `product_id` | number (FK → product) | Which product |
| `min_qty` | number | From this quantity |
| `max_qty` | number (can be empty) | Up to this quantity. Empty = no upper limit |
| `unit_price` | decimal | Price per unit in this range |
| `currency` | text | Currency |
 
**Example for Turmeric:**
 
| min_qty | max_qty | unit_price |
|---|---|---|
| 100 | 499 | 5.00 USD |
| 500 | 999 | 4.50 USD |
| 1000 | (empty) | 4.00 USD |
 
**Rule:** the ranges must not overlap, and there must be no gaps. The system must check this when saving.
 
---
 
## B.6 Table: `product_media` — images and video
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `product_id` | number (FK → product) | Which product |
| `media_type` | text | `IMAGE` or `VIDEO` |
| `file_url` | text | Where the file is stored |
| `is_primary` | yes/no | Is this the main picture |
| `sort_order` | number | Display order |
 
---
 
## B.7 Table: `product_approval_log` — who approved what
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `product_id` | number (FK → product) | Which product |
| `stage` | text | `CHECKER` (vendor side) or `ADMIN` (platform side) |
| `action` | text | `APPROVED` or `REJECTED` |
| `actor_user_id` | number (FK → user) | Who did it |
| `comments` | text | Reason, especially for rejection |
| `created_at` | date+time | When |
 
**Easy explanation:** this is the history. Six months later you can prove who approved a product and why. Never delete rows from this table.
 
---
 
# PART C — Inventory
 
This covers the **Inventory** menu: stock tracking and low-stock alerts. Stock belongs to the **Organization**.
 
## C.1 Table: `inventory` — current stock
 
One row per product.
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `product_id` | number (FK → product) | Which product |
| `organization_id` | number (FK → organization) | Which vendor company |
| `warehouse_location` | text (can be empty) | Warehouse or stock location shown in the vendor UI |
| `quantity_available` | number | Stock free to sell right now |
| `quantity_reserved` | number | Held for orders not yet shipped |
| `low_stock_threshold` | number | Warn when stock falls below this |
| `unit` | text | `KG`, `PIECE`, etc. |
| `last_updated_at` | date+time | Last change |
 
**Easy explanation of available vs reserved:**
 
A buyer orders 200 kg. You do not remove it from stock immediately — the vendor may still reject the order. Instead you **reserve** it:
 
```
Before order:   available = 1000,  reserved = 0
Order placed:   available =  800,  reserved = 200
Order shipped:  available =  800,  reserved = 0    (200 gone for good)
Order rejected: available = 1000,  reserved = 0    (200 returned)
```
 
This stops two buyers from buying the same stock at the same time.
 
---
 
## C.2 Table: `stock_movement` — every stock change
 
One row every single time stock moves. Never edit, never delete.
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `product_id` | number (FK → product) | Which product |
| `organization_id` | number (FK → organization) | Which vendor company |
| `movement_type` | text | `PURCHASE_IN`, `SALE_OUT`, `RESERVED`, `RELEASED`, `ADJUSTMENT`, `DAMAGE` |
| `quantity` | number | How much. Positive = in, negative = out |
| `balance_after` | number | Stock level after this change |
| `reference_type` | text | `ORDER`, `MANUAL`, etc. |
| `reference_id` | number | Which order caused it |
| `notes` | text | Reason |
| `created_by` | number (FK → user) | Who did it |
| `created_at` | date+time | When |
 
**Easy explanation:** the `inventory` table tells you **how much you have now**. This table tells you **how you got there**. If a number ever looks wrong, you read this table to find out what happened.
 
---
 
## C.3 Table: `stock_alert` — low stock warnings
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `product_id` | number (FK → product) | Which product |
| `organization_id` | number (FK → organization) | Which vendor company |
| `alert_type` | text | `LOW_STOCK` or `OUT_OF_STOCK` |
| `current_quantity` | number | Stock at the time of the alert |
| `threshold` | number | The limit that was crossed |
| `status` | text | `OPEN`, `NOTIFIED`, `RESOLVED` |
| `notified_at` | date+time | When the vendor was emailed |
| `created_at` | date+time | When the alert was raised |
 
**Easy explanation:** a job runs daily, checks every product, and creates a row here when stock falls below the limit. `status` stops the system from sending the same email every single day.
 
---
 
# PART D — Orders
 
This covers the **Orders** menu and the Accept / Reject buttons in your screen.
 
**Note the two different sides of an order:** the **buyer side is a person** (`buyer_user_id`), and the **vendor side is a company** (`vendor_org_id`).
 
## D.1 Table: `order` — the order header
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `order_number` | text | Readable number shown on screen, like `#101` |
| `buyer_user_id` | number (FK → **user**) | **Which buyer person placed it** |
| `vendor_org_id` | number (FK → **organization**) | **Which vendor company will supply it** |
| `quotation_id` | number (FK → quotation, can be empty) | If the order came from an accepted quote |
| `shipping_address_id` | number (FK → buyer_address) | Where to deliver |
| `source_country` | text | Where goods come from |
| `destination_country` | text | Where goods go |
| `currency` | text | Currency of this order |
| `fx_rate` | decimal | Exchange rate used |
| `fx_rate_at` | date+time | When that rate was taken |
| `subtotal` | decimal | Price of goods |
| `shipping_cost` | decimal | Freight |
| `duty_estimate` | decimal | Estimated customs duty |
| `tax_amount` | decimal | Tax |
| `total_amount` | decimal | Final total |
| `status` | text | See below |
| `placed_at` | date+time | When the buyer ordered |
| `created_at`, `updated_at` | date+time | Timestamps |
 
**Why store `fx_rate` on the order?**
Today 1 USD = 83 INR. Next month it may be 85. The invoice must always show the rate used on the day of the order. So you save it — you never look it up again later.
 
**Status values:**
 
| Status | Meaning |
|---|---|
| `PENDING` | New order. Waiting for the vendor to accept |
| `ACCEPTED` | Vendor said yes |
| `REJECTED` | Vendor said no |
| `PROCESSING` | Being prepared |
| `READY_TO_SHIP` | Packed |
| `SHIPPED` | Handed to the courier |
| `IN_TRANSIT` | On the way |
| `DELIVERED` | Buyer received it |
| `CANCELLED` | Cancelled |
 
```
PENDING ──accept──▶ ACCEPTED ──▶ PROCESSING ──▶ READY_TO_SHIP
   │                                                  │
   └──reject──▶ REJECTED                              ▼
                                    SHIPPED ──▶ IN_TRANSIT ──▶ DELIVERED
```
 
In your screen, order `#101` is `PENDING`, which is why Accept and Reject buttons are showing. Once the vendor clicks one, those buttons must disappear. Drive that from `order.status` — never from the UI alone.
 
---
 
## D.2 Table: `order_item` — the products inside the order
 
One row per product in the order.
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `order_id` | number (FK → order) | Which order |
| `product_id` | number (FK → product) | Which product |
| `product_name` | text | **Copy** of the name at order time |
| `hs_code` | text | **Copy** of the HS code at order time |
| `quantity` | number | How many |
| `unit` | text | `KG`, `PIECE` |
| `unit_price` | decimal | Price per unit used |
| `line_total` | decimal | quantity × unit_price |
| `currency` | text | Currency |
 
**Very important — why copy the name and price?**
 
If the vendor changes the product price next month, the old order must still show the **old** price. If you only kept a link to the product, the old invoice would change by itself. That would be illegal for a customs document.
 
So: **always copy the important values into the order line.** This is called a snapshot.
 
---
 
## D.3 Table: `order_status_history` — the tracking trail
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `order_id` | number (FK → order) | Which order |
| `from_status` | text | Old status |
| `to_status` | text | New status |
| `changed_by` | number (FK → user) | Who changed it |
| `reason` | text | Why — mandatory for reject and cancel |
| `created_at` | date+time | When |
 
**Easy explanation:** this is what powers "Order tracking" on the screen. You simply show these rows in order, oldest first.
 
---
 
# PART E — RFQ (Request For Quotation)
 
This covers the **RFQ** menu: "View buyer requests" and "Send quotation".
 
**What is an RFQ in simple words?**
A buyer says: *"I want 5000 kg of turmeric, delivered to USA, my target price is 4 USD per kg. Who can supply?"*
A vendor replies with a price. That reply is a **quotation**.
 
Again note the two sides: the RFQ comes from a **person** (buyer), the quotation comes from a **company** (vendor).
 
## E.1 Table: `rfq` — the buyer's request
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `rfq_number` | text | Readable number, like `RFQ-2026-0045` |
| `buyer_user_id` | number (FK → **user**) | **Which buyer person asked** |
| `product_id` | number (FK → product, can be empty) | If asked from a product page |
| `vendor_org_id` | number (FK → organization, can be empty) | If sent to one vendor only. Empty = sent to many |
| `category_id` | number (FK → category) | Which product group |
| `requirement_text` | text | What the buyer wants, in their own words |
| `quantity` | number | How much |
| `unit` | text | `KG`, `PIECE` |
| `target_price` | decimal | The price the buyer hopes for |
| `target_currency` | text | Currency |
| `delivery_country` | text | Where to deliver |
| `expected_delivery_date` | date | When they need it |
| `status` | text | `OPEN`, `QUOTED`, `ACCEPTED`, `CLOSED`, `EXPIRED` |
| `valid_until` | date | Last date to reply |
| `created_at` | date+time | When raised |
 
---
 
## E.2 Table: `quotation` — the vendor's reply
 
One RFQ can receive **many** quotations, one from each vendor company.
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `quotation_number` | text | Readable number |
| `rfq_id` | number (FK → rfq) | Which request this answers |
| `vendor_org_id` | number (FK → **organization**) | **Which vendor company is replying** |
| `unit_price` | decimal | Their offered price per unit |
| `currency` | text | Currency |
| `quantity` | number | Quantity they can supply |
| `total_price` | decimal | Full amount |
| `lead_time_days` | number | How many days to deliver |
| `payment_terms` | text | Example: 30% advance, 70% on delivery |
| `delivery_terms` | text | Who pays freight |
| `notes` | text | Extra message to the buyer |
| `valid_until` | date | Offer expires on this date |
| `status` | text | `SENT`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `WITHDRAWN` |
| `created_by` | number (FK → user) | Which vendor user sent it |
| `created_at` | date+time | When sent |
 
**Rule:** after `valid_until` passes, a daily job changes the status to `EXPIRED`. A buyer must not be able to accept an old price.
 
---
 
## E.3 Table: `rfq_message` — conversation on the RFQ
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `rfq_id` | number (FK → rfq) | Which request |
| `quotation_id` | number (FK → quotation, can be empty) | Which quote, if any |
| `sender_user_id` | number (FK → user) | Who wrote it |
| `sender_type` | text | `BUYER` or `VENDOR` |
| `message` | text | The message |
| `attachment_url` | text | Any attached file |
| `created_at` | date+time | When |
 
**Easy explanation:** this is the chat between buyer and vendor while they negotiate. It also serves as proof of what was agreed.
 
---
 
## E.4 How RFQ becomes an order
 
```
Buyer (a person) creates RFQ  ──▶  status OPEN
        │
        ▼
Vendor Company A sends quotation  ┐
Vendor Company B sends quotation  ├──▶  RFQ status = QUOTED
Vendor Company C sends quotation  ┘
        │
        ▼
Buyer compares and accepts Company B
        │
        ├──▶ Company B quotation = ACCEPTED
        ├──▶ Company A and C quotations = REJECTED
        ├──▶ RFQ status = ACCEPTED
        └──▶ A new ORDER is created:
                 buyer_user_id  = the buyer person
                 vendor_org_id  = Company B
                 quotation_id   = B's quote
                 price          = B's quoted price
```
 
**Important:** the order must use the **quoted price**, not the normal list price. That is why `order` has a `quotation_id` column — it remembers where the price came from.
 
---
 
# PART F — Dashboard, Earnings and Analytics
 
This covers the **Dashboard** and **Analytics** menus.
 
## F.1 Dashboard numbers are NOT stored
 
The dashboard shows Total Orders, Earnings and Products Count.
 
**Do not create a table for these.** They are **calculated** from the tables you already have:
 
| Dashboard box | How it is calculated |
|---|---|
| Total orders | Count rows in `order` where `vendor_org_id` = this vendor's company |
| Earnings | Add up `net_amount` in `vendor_earning` for this company |
| Products count | Count rows in `product` where `organization_id` = this company |
| Pending orders | Count rows in `order` where status = `PENDING` |
| Low stock items | Count rows in `stock_alert` where status = `OPEN` |
 
Note that every dashboard number is filtered by `organization_id` — **the company**, not the logged-in person. Ramesh and Suresh both see the same dashboard, because they work for the same company.
 
**Why not store the numbers?** Because a stored number goes wrong the moment anyone changes anything. Always calculate from the real data.
 
**Later**, when you have lots of data and the dashboard becomes slow, you add a small summary table refreshed every hour. Not now.
 
---
 
## F.2 Table: `vendor_earning` — money earned per order
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `vendor_org_id` | number (FK → organization) | Which vendor company |
| `order_id` | number (FK → order) | Which order |
| `gross_amount` | decimal | Full order value |
| `commission_rate` | decimal | Platform's percentage |
| `commission_amount` | decimal | Platform's cut |
| `tax_amount` | decimal | Tax |
| `net_amount` | decimal | What the vendor actually gets |
| `currency` | text | Currency |
| `status` | text | `PENDING`, `PAYABLE`, `PAID`, `ON_HOLD` |
| `earned_at` | date+time | When the order was delivered |
| `paid_at` | date+time | When money was sent |
 
**Easy explanation:**
Order value 1000 USD, commission 10%.
`gross_amount` = 1000, `commission_amount` = 100, `net_amount` = 900.
The vendor company sees 900 in Earnings.
 
Money belongs to the **company**, not to the person who handled the order.
 
---
 
## F.3 Table: `payment_history` — money actually sent
 
| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `vendor_org_id` | number (FK → organization) | Which vendor company |
| `payment_reference` | text | Bank reference / UTR number |
| `amount` | decimal | Amount paid |
| `currency` | text | Currency |
| `payment_method` | text | `BANK_TRANSFER`, `RAZORPAY`, `PAYPAL` |
| `status` | text | `INITIATED`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `initiated_at` | date+time | When started |
| `completed_at` | date+time | When money reached the vendor |
| `failure_reason` | text | If it failed, why |
 
## F.4 Table: `payment_earning_link` — which earnings were in which payment
 
One payment usually covers several orders.
 
| Column | Type | Simple meaning |
|---|---|---|
| `payment_id` | number (FK → payment_history) | The payment |
| `earning_id` | number (FK → vendor_earning) | The earning included in it |
| `amount` | decimal | How much of that earning was paid |
 
**Easy explanation:** the vendor gets one bank transfer of 5000 USD covering 6 orders. This table connects that one payment to those 6 earning rows, so the vendor can see exactly what was paid for.
 
---
 
## F.5 Analytics — Sales report
 
Like the dashboard, the sales report is **calculated**, not stored. You read `order` + `order_item` and group them:
 
| Report | How |
|---|---|
| Sales by month | Group orders by month, add up totals |
| Top products | Group `order_item` by product, add up quantity |
| Sales by country | Group orders by `destination_country` |
| Order status breakdown | Count orders by status |
| Accept vs reject rate | Count accepted ÷ total |
 
**One tip:** put an **index** on `vendor_org_id`, `status` and `placed_at` in the `order` table. Without it, reports become slow as data grows.
 
---
 
## F.6 Table: `vendor_document` - export document metadata

This covers the vendor UI's **Documents & Compliance** screen. The real file should live in object storage; this table stores only the searchable metadata, status, and review trail.

| Column | Type | Simple meaning |
|---|---|---|
| `id` | number | Unique number |
| `organization_id` | number (FK -> organization) | Which vendor company owns this document |
| `document_type` | text | Example: `CERTIFICATE_OF_ORIGIN`, `COMMERCIAL_INVOICE`, `EXPORT_LICENSE` |
| `category` | text | `TRADE`, `COMMERCIAL`, `COMPLIANCE`, `LOGISTICS`, `BANKING` |
| `display_name` | text | Name shown in the UI |
| `reference_number` | text (can be empty) | Certificate number, invoice number, license number |
| `file_url` | text (can be empty) | Signed/object-storage URL or public-safe file reference |
| `storage_key` | text (can be empty) | Internal object-storage key |
| `status` | text | `MISSING`, `UPLOADED`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`, `EXPIRED` |
| `issued_at` | date (can be empty) | When the document was issued |
| `expires_at` | date (can be empty) | Expiry date, if any |
| `uploaded_by` | number (FK -> user, can be empty) | Vendor user who uploaded it |
| `verified_by` | number (FK -> user, can be empty) | Platform user who verified it |
| `verified_at` | date+time (can be empty) | When platform verified it |
| `rejection_reason` | text (can be empty) | Why it was rejected |
| `created_at`, `updated_at` | date+time | Timestamps |

**Important database rules:**

- Only vendor organizations can have document rows.
- Do not store the file itself in PostgreSQL.
- Add an index on `organization_id + status`, because the UI shows readiness, verified, pending, and expiring counts.
- If `status = VERIFIED`, `verified_by` and `verified_at` must be filled.
- If `status = REJECTED`, `rejection_reason` must be filled.

---

# PART G — Full Relationship Map
 
```
                    ┌──────────────────────────────┐
                    │        ORGANIZATION           │
                    │  PLATFORM (1 row) or VENDOR   │
                    └───────────┬──────────────────┘
                 ┌──────────────┼───────────────────┐
                 │              │                   │
        ┌────────▼──────┐  ┌────▼─────────────┐ ┌──▼──────────┐
        │     USER      │  │ VENDOR_TARGET_   │ │   PRODUCT   │
        │ PLATFORM /    │  │    COUNTRY       │ │             │
        │ VENDOR /      │  └──────────────────┘ └──┬──────────┘
        │ BUYER         │                          │
        └───┬───────┬───┘            ┌─────────────┼───────────────┐
            │       │                │             │               │
   ┌────────▼──┐  ┌─▼─────────┐  ┌───▼────────┐ ┌──▼─────────┐ ┌──▼────────┐
   │ USER_ROLE │  │ BUYER_    │  │ PRODUCT_   │ │ PRODUCT_   │ │ PRODUCT_  │
   │           │  │ PROFILE   │  │ PRICE_TIER │ │ TARGET_    │ │ MEDIA     │
   └────┬──────┘  │ BUYER_    │  └────────────┘ │ COUNTRY    │ └───────────┘
        │         │ ADDRESS   │                 └────────────┘
   ┌────▼──────┐  └───────────┘                        │
   │   ROLE    │   (buyers only)              ┌────────▼─────────┐
   └────┬──────┘                              │    INVENTORY     │
        │                                     └────────┬─────────┘
   ┌────▼───────────────┐              ┌───────────────┼──────────────┐
   │  ROLE_PERMISSION   │       ┌──────▼──────────┐  ┌─▼─────────────┐
   └────┬───────────────┘       │ STOCK_MOVEMENT  │  │  STOCK_ALERT  │
        │                       └─────────────────┘  └───────────────┘
   ┌────▼──────────┐
   │  PERMISSION   │
   └───────────────┘
 
 
   BUYER (person)                    VENDOR (company)
        │                                   │
        │ raises                            │ replies
        ▼                                   ▼
   ┌──────────┐                     ┌───────────────┐
   │   RFQ    │────── many ────────▶│   QUOTATION   │
   └────┬─────┘                     └───────┬───────┘
        │                                   │ accepted
   ┌────▼─────────┐                         ▼
   │ RFQ_MESSAGE  │                 ┌───────────────┐
   └──────────────┘                 │     ORDER     │
                                    │ buyer_user_id │
                                    │ vendor_org_id │
                                    └───────┬───────┘
                        ┌───────────────────┼──────────────────┐
              ┌─────────▼────┐   ┌──────────▼───────┐  ┌───────▼────────┐
              │ ORDER_ITEM   │   │ ORDER_STATUS_    │  │ VENDOR_EARNING │
              └──────────────┘   │    HISTORY       │  └───────┬────────┘
                                 └──────────────────┘          │
                                          ┌────────────────────▼──────┐
                                          │  PAYMENT_EARNING_LINK      │
                                          └────────────┬───────────────┘
                                          ┌────────────▼───────────────┐
                                          │     PAYMENT_HISTORY         │
                                          └─────────────────────────────┘
```
 
---
 
# PART H — Complete Table List
 
| # | Table | What it stores | Belongs to | Module |
|---|---|---|---|---|
| 1 | `organization` | Vendor companies + the platform | — | Registration |
| 2 | `vendor_target_country` | Countries a vendor sells to | Organization | Registration |
| 3 | `user` | Every login — admin, vendor, buyer | Org or nobody | Registration |
| 4 | `buyer_profile` | Buyer's own details | **Buyer user** | Registration |
| 5 | `buyer_address` | Buyer's delivery addresses | **Buyer user** | Registration |
| 6 | `role` | Job names | — | Registration |
| 7 | `permission` | Single actions | — | Registration |
| 8 | `role_permission` | Which job can do which action | — | Registration |
| 9 | `user_role` | Which person has which job | — | Registration |
| 10 | `category` | Product groups | — | Products |
| 11 | `hs_code` | Customs code master list | — | Products |
| 12 | `product` | The product | Organization | Products |
| 13 | `product_target_country` | Countries this product can go to | Organization | Products |
| 14 | `product_price_tier` | Bulk pricing | Organization | Products |
| 15 | `product_media` | Images and video | Organization | Products |
| 16 | `product_approval_log` | Approval history | Organization | Products |
| 17 | `inventory` | Current stock | Organization | Inventory |
| 18 | `stock_movement` | Every stock change | Organization | Inventory |
| 19 | `stock_alert` | Low stock warnings | Organization | Inventory |
| 20 | `order` | Order header | **Both** — buyer user + vendor org | Orders |
| 21 | `order_item` | Products in the order | Both | Orders |
| 22 | `order_status_history` | Tracking trail | Both | Orders |
| 23 | `rfq` | Buyer's request | **Buyer user** | RFQ |
| 24 | `quotation` | Vendor's reply | Organization | RFQ |
| 25 | `rfq_message` | Chat on the RFQ | Both | RFQ |
| 26 | `vendor_earning` | Money earned per order | Organization | Analytics |
| 27 | `payment_history` | Money actually paid | Organization | Analytics |
| 28 | `payment_earning_link` | Which earnings were in which payment | Organization | Analytics |
| 29 | `vendor_document` | Export document metadata and review status | Organization | Documents |

**29 tables.** Vendor profile fields are stored on `organization`; export document metadata is stored in `vendor_document`.
 
---
 
# PART I — Rules Every Developer Must Follow
 
| # | Rule | Why |
|---|---|---|
| 1 | **Organization = vendor company only.** Buyers never get an organization row | Buyers are normal public users |
| 2 | Vendor data is filtered by `organization_id`; buyer data is filtered by `user_id` | Two different owners, two different filters |
| 3 | Every query must apply that filter — no exceptions | So one vendor never sees another vendor's data |
| 4 | Check permissions, never role names — `user.can('product.approve')` | So admin can change roles without a code release |
| 5 | Money columns use `DECIMAL(19,4)`, never `FLOAT` | Float loses paise. Your accounts will never match |
| 6 | Always store currency next to the amount | `1000` means nothing. `1000 USD` means something |
| 7 | Copy product name, price and HS code into `order_item` | So old invoices never change when the product changes |
| 8 | Never delete rows — use a `status` column instead | Trade records must be kept for years |
| 9 | Store all dates in UTC | Buyers are in other countries and time zones |
| 10 | History tables (`*_history`, `*_log`, `stock_movement`) are add-only | They are your proof. Never edit them |
| 11 | Every table has `created_at` and `updated_at` | You will need them for every single bug |
| 12 | Maker and Checker must be two different users | The system must block this when saving |
 
---
 
# PART J — Points to Confirm With the Client
 
| # | Question | Why it matters |
|---|---|---|
| 1 | A buyer signs up freely with no approval — correct? | If admin must approve buyers too, we add a `PENDING` step |
| 2 | Can a buyer mark themselves as a business (company name, tax number) without becoming an Organization? | Currently handled by `buyer_profile.buyer_type` |
| 3 | Can one vendor company have more than one **source** country? | Currently one source country per Organization |
| 4 | Who creates the extra vendor users (Maker, Checker) — the vendor owner, or the platform admin? | Changes the user-management screen |
| 5 | Can a vendor also buy on the platform? | If yes, that user needs both a vendor and a buyer role |
 
---
 
*End of Document 4 (Version 2). Related: `01_Business_Requirements_Document.md`, `02_Technical_Architecture_Document.md`, `03_Vendor_Onboarding_and_Compliance_Workflows.md`*

