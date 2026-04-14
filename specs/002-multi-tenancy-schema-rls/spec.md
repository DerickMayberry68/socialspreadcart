# Feature Specification: Multi-Tenancy Schema & Row-Level Security

**Feature Branch**: `002-multi-tenancy-schema-rls`
**Created**: 2026-04-10
**Status**: Draft
**Input**: User description: "Convert the single-tenant SocialSpreadCart database into a multi-tenant foundation. Every business-domain table MUST carry a `tenant_id` and be protected by row-level security so that one tenant's data is provably invisible and unmodifiable to another tenant. Ship alongside an automated test harness that proves cross-tenant leaks are blocked."

## Context

SocialSpreadCart is being converted from a single-tenant site (serving one owner,
"The Social Spread Cart") into a multi-tenant SaaS that hosts many mobile-cart
operators. Each operator will eventually have their own subdomain, branding,
menu, calendar, quotes, CRM, and staff — but today every row in the database
belongs, implicitly, to the single original tenant. The existing RLS policies
are cosmetic (`using (true) with check (true)`) and provide no isolation.

This feature is the **data-layer foundation** for every later multi-tenancy
phase (routing, services scoping, branding, auth roles, storage, signup). It
MUST ship first, and it MUST ship with evidence — automated tests — that the
isolation actually works. Nothing downstream can be trusted until RLS is
proven correct.

This feature does **not** introduce subdomain routing, a signup flow, a
tenant-switcher UI, per-tenant branding, or any customer-facing change. It is
purely a schema + policy + test change. The existing site continues to run
against a single "legacy" tenant row created by the backfill.

## User Scenarios & Testing

### User Story 1 — Existing Site Keeps Working After Migration (Priority: P1)

The current production data (menu items, events, quotes, contacts,
interactions, testimonials, profiles) is preserved intact and remains fully
functional for the existing owner after the migration runs. No customer or
admin notices any change in behaviour. The backfill assigns every existing row
to a single "legacy" tenant record, and the existing admin user is made an
owner of that tenant.

**Why this priority**: Shipping this change must be a no-op from the user's
point of view. If the migration breaks the live site, nothing else in the
multi-tenant refactor can proceed.

**Independent Test**: Apply the migration to a copy of production data. Browse
the public site and admin panel. Confirm: public pages render the same menu,
events, and testimonials; admin sees the same quotes, contacts, and
interactions; `POST /api/quote` still succeeds; no new errors appear in logs.

**Acceptance Scenarios**:

1. **Given** an existing database with production data, **When** the migration
   is applied, **Then** a single `tenants` row is created with slug `sarah`
   (the legacy tenant), every existing business row is updated to reference
   that tenant, and the migration completes without error.
2. **Given** the migration has been applied, **When** the existing admin user
   logs in, **Then** they can view, create, update, and delete the same
   records they could before — nothing is missing and nothing is read-only.
3. **Given** the migration has been applied, **When** a public visitor submits
   a quote via `POST /api/quote`, **Then** the quote is stored against the
   legacy tenant and the existing notification email is dispatched as before.

---

### User Story 2 — One Tenant Cannot See or Modify Another Tenant's Data (Priority: P1)

When a second tenant is added to the system (whether via SQL seed or a future
signup flow), the authenticated users of tenant A MUST NOT be able to read,
insert, update, or delete any row that belongs to tenant B — on any business
table — via any Supabase client. Attempts to cross the boundary MUST return
zero rows or be rejected by RLS, not succeed silently.

**Why this priority**: This is the entire point of the feature. Without
provable isolation, multi-tenancy is theatre. This story is the security
boundary that every later phase depends on.

**Independent Test**: An automated Vitest suite seeds two tenants with
distinct data, authenticates as an owner of tenant A, and attempts a set of
read, insert, update, and delete operations targeting tenant B's rows. Every
attempt MUST either return zero rows or be rejected. The suite is run with
`npm test` and is green.

**Acceptance Scenarios**:

1. **Given** two tenants A and B each with menu items, events, quotes,
   contacts, and interactions, **When** a user authenticated as a member of
   tenant A runs a `select` on any of those tables, **Then** they receive
   only tenant A's rows — never any row from tenant B.
2. **Given** two tenants A and B, **When** a tenant A user attempts to
   `insert` a row into any business table with `tenant_id` set to tenant B,
   **Then** the insert is rejected by the RLS `with check` clause.
3. **Given** two tenants A and B, **When** a tenant A user attempts to
   `update` a tenant B row (e.g., by primary key), **Then** the update
   affects zero rows.
4. **Given** two tenants A and B, **When** a tenant A user attempts to
   `delete` a tenant B row, **Then** the delete affects zero rows.
5. **Given** a public (anonymous) visitor on tenant A's site, **When** they
   `select` from `menu_items` or `events` or `testimonials`, **Then** they
   receive only tenant A's published rows — never any row from tenant B.

---

### User Story 3 — Public Quote Submission Still Works For Each Tenant (Priority: P2)

Anonymous visitors to any tenant's public site MUST be able to submit a quote
that is correctly scoped to that tenant — not to a different tenant and not
rejected. The quote submission path is the single most important public
action on the site and must continue to work without authentication.

**Why this priority**: Every later feature assumes that anonymous quote
submission works. If this breaks, the business breaks.

**Independent Test**: Seed two tenants. Submit a quote against each tenant
context (via a mock tenant header or a direct SQL insert setting `tenant_id`).
Confirm the quote lands under the correct tenant and is visible to that
tenant's owner but not to the other tenant's owner.

**Acceptance Scenarios**:

1. **Given** tenant A is the current tenant context, **When** an anonymous
   visitor submits a quote, **Then** the new quote row is inserted with
   `tenant_id = A` and is visible only to tenant A users.
2. **Given** tenant A is the current tenant context, **When** the insert
   attempts to specify `tenant_id = B`, **Then** the insert is rejected by
   RLS `with check`.

---

### User Story 4 — Engineers Can Introspect And Roll Back The Migration (Priority: P3)

The migration MUST be authored as a single forward-only SQL file under
`supabase/migrations/`, idempotent enough to run twice in development without
error, and accompanied by a documented rollback procedure. Engineers inspecting
the schema MUST be able to trace which rows belong to which tenant via a
consistent `tenant_id` column naming convention.

**Why this priority**: Operational hygiene. Makes the change safe to apply,
reviewable, and reversible in emergencies.

**Independent Test**: On a fresh Supabase project, run all migrations in
order. Confirm the final schema has `tenants`, `tenant_users`, and
`tenant_id` columns on every business table, all with consistent naming. A
documented rollback procedure exists in `quickstart.md`.

**Acceptance Scenarios**:

1. **Given** a fresh Supabase database, **When** all migrations are run in
   order, **Then** the final schema matches the data model in `data-model.md`
   exactly, and `tenant_id` columns exist on every required table.
2. **Given** the migration file, **When** an engineer runs it twice on the
   same database, **Then** the second run completes without error (all DDL
   is guarded with `if not exists` / `create or replace` / `drop ... if
   exists`).
3. **Given** the migration has been applied, **When** an engineer consults
   `quickstart.md`, **Then** they find a step-by-step rollback procedure.

---

### Edge Cases

- What happens when `auth.uid()` is `null` (anonymous request) on a table
  where reads are public (e.g., `menu_items`)? The public-read policy MUST
  still return the correct tenant's rows based on the request's tenant
  context — which, until Spec 003 ships, is derived from a fallback to the
  legacy tenant.
- What happens when an authenticated user belongs to zero tenants (e.g., a
  brand-new signup before they create or join a tenant)? They MUST see no
  business rows at all — not the legacy tenant's rows by accident.
- What happens when an authenticated user belongs to multiple tenants? They
  MUST see the union of their tenants' rows, not a single hardcoded one. The
  active tenant switcher is Spec 008's problem; this spec only needs the
  RLS helper function `tenant_ids_for_current_user()` to return a set.
- What happens to the existing storage buckets (`boards`, `events`)? Storage
  scoping is Spec 007. This spec does NOT change storage policies; it only
  adds columns and policies for the `public` schema tables.
- What happens if the backfill fails partway through? The migration MUST run
  inside a single transaction so partial state is impossible.

## Requirements

### Functional Requirements

- **FR-001**: The database MUST contain a `public.tenants` table recording
  one row per tenant with, at minimum: `id` (uuid PK), `slug` (unique text),
  `name` (text), `status` (text, e.g., `active`, `suspended`, `archived`),
  `created_at`, `updated_at`.
- **FR-002**: The database MUST contain a `public.tenant_users` join table
  recording tenant membership with: `tenant_id` (FK → tenants), `user_id`
  (FK → `auth.users`), `role` (text, one of `owner`, `admin`, `staff`),
  `created_at`. The composite `(tenant_id, user_id)` MUST be unique.
- **FR-003**: Every business-domain table MUST have a `tenant_id uuid not
  null references public.tenants(id)` column. The business tables covered by
  this feature are: `menu_items`, `events`, `quotes`, `testimonials`,
  `contacts`, `interactions`. (`profiles` is user-scoped, not tenant-scoped —
  see Assumptions.)
- **FR-004**: The migration MUST create a single "legacy" tenant row with
  slug `sarah` (configurable) and MUST backfill `tenant_id` on every existing
  row in every business-domain table to reference that legacy tenant before
  the `not null` constraint is enforced.
- **FR-005**: The migration MUST add the existing admin user (identified by
  `profiles.role = 'admin'`) to the legacy tenant's `tenant_users` table with
  role `owner`.
- **FR-006**: The database MUST provide a SQL helper function
  `public.tenant_ids_for_current_user()` that returns the set of tenant UUIDs
  the current `auth.uid()` belongs to (via `tenant_users`). It MUST return an
  empty set for anonymous callers.
- **FR-007**: The existing `using (true) with check (true)` RLS policies on
  every business-domain table MUST be dropped and replaced with
  tenant-scoped policies following one of four documented patterns (see
  `data-model.md`): Tenant-Only, Public Read / Tenant Write, Public Insert
  / Tenant Read, or Owner-Only.
- **FR-008**: Public anonymous `select` MUST continue to work for
  `menu_items`, `events`, and `testimonials` — but the returned rows MUST be
  restricted to a tenant context derived from the request. For this feature
  (before Spec 003), "request tenant context" is the legacy tenant; tests
  set it by directly using `tenant_id` filter + RLS helper override.
- **FR-009**: Public anonymous `insert` into `quotes` MUST continue to work
  but MUST require `tenant_id` to be set, and the RLS `with check` clause
  MUST verify the submitted `tenant_id` matches the request's tenant context.
- **FR-010**: Authenticated `select`, `insert`, `update`, `delete` on every
  business-domain table MUST be gated by
  `tenant_id = any(tenant_ids_for_current_user())`.
- **FR-011**: The migration MUST run inside a single transaction so that any
  error rolls the entire change back.
- **FR-012**: The migration MUST be idempotent: running it twice on the same
  database MUST complete without error and leave the schema in the same
  final state.
- **FR-013**: An automated Vitest test suite MUST exist at
  `tests/tenant-isolation.test.ts` that seeds two tenants and proves — for
  every business-domain table and every CRUD verb — that cross-tenant
  access is blocked. The suite MUST be runnable via `npm test` after a
  dev-dependency install.
- **FR-014**: TypeScript types generated from Supabase (the project's
  `src/lib/types.ts` or a generated file) MUST reflect the new `tenant_id`
  columns. (Actual regeneration is a task; the spec only requires that the
  types stay in sync.)
- **FR-015**: The change MUST NOT break any existing feature — in particular,
  Feature 001 (booking quote form) MUST continue to pass its quickstart
  validation after the migration is applied.

### Key Entities

- **Tenant**: A single business operator using the SocialSpreadCart platform.
  Attributes: slug (subdomain-safe identifier), display name, status
  (active / suspended / archived). One tenant owns many menu items, events,
  quotes, contacts, interactions, and testimonials.
- **TenantUser**: A membership record linking an authenticated user to a
  tenant with a role. A user may belong to multiple tenants. A tenant may
  have multiple users.
- **Tenant-Scoped Business Row**: Any row in `menu_items`, `events`, `quotes`,
  `testimonials`, `contacts`, or `interactions`. Every such row belongs to
  exactly one tenant via a non-null `tenant_id` foreign key.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of business-domain rows in a freshly migrated database
  have a non-null `tenant_id` pointing to a valid row in `public.tenants`.
- **SC-002**: The `tests/tenant-isolation.test.ts` Vitest suite passes
  with zero failures. Every business-domain table has at least one test
  case covering `select`, `insert`, `update`, and `delete` cross-tenant
  attempts. Target: ≥ 24 assertions total (6 tables × 4 verbs).
- **SC-003**: The existing Feature 001 quickstart (`specs/001-booking-quote-form/quickstart.md`)
  passes end-to-end against the migrated database with zero changes to its
  steps.
- **SC-004**: Running the migration twice on the same database completes
  without error on the second run (idempotency check).
- **SC-005**: A fresh clone of the repository, with a fresh Supabase local
  project, can run `supabase db reset` and land in a working multi-tenant
  schema within 5 minutes without manual SQL fix-up.
- **SC-006**: No existing Feature 001 admin page, API route, or public page
  shows a new error in the browser console or server logs after the
  migration is applied.

## Assumptions

- The legacy tenant slug is `sarah` and the legacy tenant display name is
  "The Social Spread Cart". These values are configurable in the migration
  but default to these.
- `profiles` is NOT made tenant-scoped in this feature. A profile represents
  an authenticated user, and the `tenant_users` join table handles their
  tenant membership. Making profiles tenant-scoped would require every user
  to have N profiles, which is wrong.
- Storage bucket scoping (`boards`, `events`) is explicitly **out of scope**
  for this feature. Storage policies remain as-is and will be addressed in
  Spec 007.
- Subdomain-based tenant resolution is **out of scope**. The middleware will
  be updated in Spec 003 to set a tenant context per-request. Until then,
  the app derives tenant context from the legacy tenant row.
- The current server code uses the Supabase anon key for public reads and a
  service-role key for admin writes. This feature assumes that continues
  and that service-role code will be updated in Spec 004 to pass a
  `tenant_id` explicitly. The service-role client is **not** subject to RLS,
  so the tests must run under the anon + authenticated roles to be
  meaningful.
- The Vitest dev dependency (`vitest` + `@vitest/ui` optional) will be added
  as part of this feature. The test script entry `"test": "vitest run"` will
  be added to `package.json`.
- All existing admin users have `profiles.role = 'admin'`. The backfill
  treats every admin profile as an `owner` of the legacy tenant.
- The four RLS policy patterns — Tenant-Only, Public Read / Tenant Write,
  Public Insert / Tenant Read, and Owner-Only — are defined in
  `data-model.md` and applied per-table per a mapping in that document.
- No changes to `auth.users` or any schema outside `public` are permitted.
