# Data Model: Multi-Tenancy Schema & RLS

**Feature**: 002-multi-tenancy-schema-rls
**Date**: 2026-04-10

## Summary

This feature introduces two new tables (`tenants`, `tenant_users`), adds a
`tenant_id` column to six existing business-domain tables, and replaces every
cosmetic RLS policy on those tables with a tenant-scoped policy driven by a
single SQL helper function.

---

## New Entities

### Tenant

Stored in `public.tenants` (NEW).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | uuid | PK | `default gen_random_uuid()` |
| slug | text | yes | Unique; subdomain-safe (lowercase, `a-z 0-9 -`); used for subdomain resolution in Spec 003 |
| name | text | yes | Display name shown in admin and on the public site |
| status | text | yes | One of `active`, `suspended`, `archived`; default `active` |
| created_at | timestamptz | auto | `default now()` |
| updated_at | timestamptz | auto | `default now()` |

**Constraints**:
- `unique (slug)`
- `check (status in ('active', 'suspended', 'archived'))`
- `check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$')` — defensive slug validation

**Seeded Rows** (by the migration):
- One legacy tenant: `slug = 'sarah'`, `name = 'The Social Spread Cart'`, `status = 'active'`.

---

### TenantUser

Stored in `public.tenant_users` (NEW).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| tenant_id | uuid | yes | FK → `public.tenants(id)` `on delete cascade` |
| user_id | uuid | yes | FK → `auth.users(id)` `on delete cascade` |
| role | text | yes | One of `owner`, `admin`, `staff`; default `staff` |
| created_at | timestamptz | auto | `default now()` |

**Constraints**:
- `primary key (tenant_id, user_id)` — a user has exactly one role per tenant
- `check (role in ('owner', 'admin', 'staff'))`

**Seeded Rows** (by the migration):
- For every `profiles` row where `role = 'admin'`, insert a `tenant_users`
  row linking that user to the legacy tenant with `role = 'owner'`.

---

## Modified Entities

The following six tables each receive a new column and updated RLS policies.
No other columns change.

### Common Column Added To All Six Tables

```sql
tenant_id uuid not null references public.tenants(id) on delete cascade
```

Backfill order is:
1. Add column as nullable.
2. `update <table> set tenant_id = <legacy_tenant_id>` where `tenant_id is null`.
3. `alter column tenant_id set not null`.
4. Add FK constraint.

Index: every table gets `create index on <table> (tenant_id)` for query performance.

### Per-Table Summary

| Table | Purpose | RLS Pattern | Notes |
|-------|---------|-------------|-------|
| `menu_items` | Public-readable menu catalogue | Public Read / Tenant Write | Anon `select` allowed but scoped to current tenant context |
| `events` | Public-readable events calendar | Public Read / Tenant Write | Same pattern as menu_items |
| `testimonials` | Public-readable testimonials | Public Read / Tenant Write | Same pattern as menu_items |
| `quotes` | Customer inquiry records | Public Insert / Tenant Read | Anon `insert` allowed with `with check` enforcing `tenant_id`; authenticated reads are tenant-scoped |
| `contacts` | CRM contact records | Tenant-Only | Authenticated-only full CRUD, scoped to tenant |
| `interactions` | CRM interaction timeline | Tenant-Only | Authenticated-only full CRUD, scoped to tenant |

See [contracts/rls-policies.md](contracts/rls-policies.md) for the exact SQL.

### Notes Per Table

- **`menu_items.id`** is currently a `text` PK — this stays the same. Only
  `tenant_id` is added. Slugs within a tenant remain unique via a per-tenant
  composite unique index: `unique (tenant_id, slug)`. The existing
  `unique (slug)` constraint is dropped.
- **`events.id`** is a `text` PK — same treatment; `id` scoping is per-tenant
  via application logic (no multi-tenant key collision expected).
- **`testimonials.id`** is a `text` PK — unchanged.
- **`quotes.id`** remains `uuid`. `contact_id` FK remains as-is; the
  `contacts` row it points to is constrained to the same tenant via
  application-layer logic in Spec 004.
- **`contacts`**: the existing `contacts_email_idx` (unique on lower(email))
  MUST be dropped and replaced with a per-tenant unique index:
  `unique (tenant_id, lower(email))`. Two different tenants must be allowed
  to have customers with the same email.
- **`interactions`**: `contact_id` FK remains. Isolation is enforced via the
  `tenant_id` column directly on `interactions` (not transitively through
  `contacts`) so that tests can make direct assertions without joining.

---

## Not Modified

- **`profiles`**: NOT given a `tenant_id`. A profile is a single user record;
  tenant membership is via `tenant_users`. Profile RLS is unchanged.
- **`auth.*`**: No changes. This feature does not touch any schema outside
  `public`.
- **`storage.*`**: No changes in this feature. Storage scoping is Spec 007.

---

## New Functions

### `public.tenant_ids_for_current_user() returns setof uuid`

```sql
create or replace function public.tenant_ids_for_current_user()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from public.tenant_users
  where user_id = auth.uid()
$$;
```

**Notes**:
- `stable` — the result does not change within a single statement, so the
  planner can cache it.
- `security definer` — the function must be able to read `tenant_users`
  regardless of RLS on that table. The function body only ever returns
  rows where `user_id = auth.uid()`, so it cannot leak data.
- `search_path = public` — mitigates the `security definer` pitfall where
  a malicious search_path could shadow `tenant_users`.
- Returns empty set for anonymous callers (`auth.uid()` is null → no rows
  match → empty set).

### `public.current_tenant_id() returns uuid` (OPTIONAL / DEFERRED)

Spec 003 will introduce request-scoped tenant context via a setting or
header. This function is **not** created in this feature; it's deferred to
Spec 003. The current feature uses only `tenant_ids_for_current_user()`.

---

## Type Regeneration

After the migration is applied, run:

```bash
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

If the project does not yet have `database.types.ts`, this feature introduces
it. The generated file MUST be committed alongside the migration so that any
TypeScript caller using the types gets the new `tenant_id` fields.

---

## Migration Ordering Notes

- The migration MUST run **after** `20260408_crm_and_auth.sql` (which creates
  `profiles`, `contacts`, `interactions`) and **before** any future Spec 003+
  migrations.
- File name: `supabase/migrations/20260410_multi_tenancy.sql`. The `20260410`
  prefix ensures lexical ordering.
- All DDL is wrapped in a single `begin; ... commit;` block so that any
  error rolls back the entire change.

---

## Rollback

Rollback is by forward migration — not by editing the original file. To
undo this change, create a new migration that:

1. Drops the new policies.
2. Drops the `tenant_id` column from each business table.
3. Drops `tenant_users` and `tenants` tables.
4. Drops `tenant_ids_for_current_user()`.
5. Restores the `using (true) with check (true)` placeholder policies.

The rollback SQL is documented in `quickstart.md` but is NOT committed as a
migration file. Engineers apply it manually in the rare emergency case.
