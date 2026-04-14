# Contract: Row-Level Security Policies

**Feature**: 002-multi-tenancy-schema-rls
**Date**: 2026-04-10

## Overview

Every business-domain table in the `public` schema uses exactly one of the
four RLS patterns defined below. The pattern chosen per table is the table's
"contract" — callers and tests may rely on the behaviours listed here.

All patterns use the helper function `public.tenant_ids_for_current_user()`
(defined in `data-model.md`) to determine the set of tenants the current
authenticated user belongs to.

---

## Pattern 1: Tenant-Only

**Who can read**: Only authenticated users who are members of the same tenant
as the row.
**Who can write (insert/update/delete)**: Same as read.
**Anonymous access**: None.

**Used by**: `contacts`, `interactions`

**Policy SQL** (parameterised on `<table>`):

```sql
alter table public.<table> enable row level security;

drop policy if exists "<table>_tenant_select" on public.<table>;
create policy "<table>_tenant_select"
  on public.<table>
  for select
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "<table>_tenant_insert" on public.<table>;
create policy "<table>_tenant_insert"
  on public.<table>
  for insert
  to authenticated
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "<table>_tenant_update" on public.<table>;
create policy "<table>_tenant_update"
  on public.<table>
  for update
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()))
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "<table>_tenant_delete" on public.<table>;
create policy "<table>_tenant_delete"
  on public.<table>
  for delete
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()));
```

---

## Pattern 2: Public Read / Tenant Write

**Who can read**: Everyone (`anon` and `authenticated`). Reads are **not**
tenant-scoped at the database layer because Spec 002 does not yet have
request-scoped tenant context; tenant scoping of public reads is enforced at
the application layer (query includes `.eq('tenant_id', currentTenantId)`)
until Spec 003 lands and introduces a per-request tenant setting.
**Who can write**: Only authenticated users who are members of the same
tenant as the row.
**Anonymous access**: Read only.

**Used by**: `menu_items`, `events`, `testimonials`

> **Design note**: It is tempting to scope public reads at the database
> layer using a session GUC (`current_setting('app.current_tenant_id')`).
> That is the correct long-term answer and is slated for Spec 003. For this
> feature, the application always filters by `tenant_id` explicitly, and the
> test suite covers the authenticated side — which is the only side where
> RLS can actually leak authenticated-only data.

**Policy SQL**:

```sql
alter table public.<table> enable row level security;

drop policy if exists "<table>_public_select" on public.<table>;
create policy "<table>_public_select"
  on public.<table>
  for select
  to anon, authenticated
  using (true);

drop policy if exists "<table>_tenant_insert" on public.<table>;
create policy "<table>_tenant_insert"
  on public.<table>
  for insert
  to authenticated
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "<table>_tenant_update" on public.<table>;
create policy "<table>_tenant_update"
  on public.<table>
  for update
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()))
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "<table>_tenant_delete" on public.<table>;
create policy "<table>_tenant_delete"
  on public.<table>
  for delete
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()));
```

---

## Pattern 3: Public Insert / Tenant Read

**Who can insert**: Anyone (`anon` and `authenticated`), but the submitted
`tenant_id` MUST be set and MUST match a tenant that exists. For this
feature, any existing tenant id is accepted — Spec 003 will tighten this to
"matches the request's tenant context". The application layer sets
`tenant_id` explicitly before inserting.
**Who can read**: Only authenticated users who are members of the same
tenant as the row.
**Who can update / delete**: Same as read.

**Used by**: `quotes`

**Policy SQL**:

```sql
alter table public.quotes enable row level security;

drop policy if exists "quotes_public_insert" on public.quotes;
create policy "quotes_public_insert"
  on public.quotes
  for insert
  to anon, authenticated
  with check (
    tenant_id is not null
    and exists (select 1 from public.tenants t where t.id = tenant_id and t.status = 'active')
  );

drop policy if exists "quotes_tenant_select" on public.quotes;
create policy "quotes_tenant_select"
  on public.quotes
  for select
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "quotes_tenant_update" on public.quotes;
create policy "quotes_tenant_update"
  on public.quotes
  for update
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()))
  with check (tenant_id in (select public.tenant_ids_for_current_user()));

drop policy if exists "quotes_tenant_delete" on public.quotes;
create policy "quotes_tenant_delete"
  on public.quotes
  for delete
  to authenticated
  using (tenant_id in (select public.tenant_ids_for_current_user()));
```

---

## Pattern 4: Owner-Only

**Who can read / write**: Only authenticated users whose `tenant_users.role`
is `owner` for the row's tenant.
**Anonymous access**: None.

**Used by**: No tables in scope for this feature. Reserved for future
use by tenant-settings tables introduced in Spec 005 and Spec 008.

**Policy SQL template** (for reference):

```sql
-- Used with a helper:
-- create function owner_tenant_ids() returns setof uuid
-- language sql stable security definer set search_path = public as $$
--   select tenant_id from public.tenant_users
--   where user_id = auth.uid() and role = 'owner'
-- $$;
```

Deferred. This feature does not create `owner_tenant_ids()` — Spec 005 will.

---

## Per-Table Assignment

| Table | Pattern |
|-------|---------|
| `menu_items` | Pattern 2: Public Read / Tenant Write |
| `events` | Pattern 2: Public Read / Tenant Write |
| `testimonials` | Pattern 2: Public Read / Tenant Write |
| `quotes` | Pattern 3: Public Insert / Tenant Read |
| `contacts` | Pattern 1: Tenant-Only |
| `interactions` | Pattern 1: Tenant-Only |

---

## Old Policies To Drop

Every pre-existing policy on the six business tables MUST be explicitly
dropped at the start of the migration (after adding `tenant_id`, before
enabling the new policies). The full list:

- `menu_items`: `Public read menu_items`, `Authenticated write menu_items`
- `events`: `Public read events`, `Authenticated write events`
- `testimonials`: `Public read testimonials`, `Authenticated write testimonials`
- `quotes`: `Public insert quotes`, `Authenticated read quotes`,
  `Authenticated update quotes`, `Authenticated delete quotes`
- `contacts`: `Authenticated all contacts`
- `interactions`: `Authenticated all interactions`

Use `drop policy if exists ... on public.<table>;` for each so that
re-running the migration does not error.

---

## Test Expectations

The `tests/tenant-isolation.test.ts` suite asserts the behaviour of each
pattern exactly. Specifically, for every table:

1. **Tenant A authenticated user** can `select` tenant A rows and
   CANNOT `select` tenant B rows (zero rows returned).
2. **Tenant A authenticated user** CANNOT `insert` a row with
   `tenant_id = B` (RLS check violation).
3. **Tenant A authenticated user** CANNOT `update` tenant B rows
   (zero rows affected; no error).
4. **Tenant A authenticated user** CANNOT `delete` tenant B rows
   (zero rows affected; no error).

For Pattern 2 tables (public read), an additional assertion:
- **Anon user with `.eq('tenant_id', A)` filter** sees only tenant A rows.

For Pattern 3 (`quotes`), additional assertions:
- **Anon user** CAN `insert` a quote with `tenant_id = A`.
- **Anon user** CANNOT `insert` a quote with `tenant_id = null`.
- **Anon user** CANNOT `select` any quotes (no policy grants anon read).
